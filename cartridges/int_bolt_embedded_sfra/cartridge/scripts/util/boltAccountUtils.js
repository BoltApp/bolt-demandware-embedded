'use strict';

// API Includes
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMgr = require('dw/order/ShippingMgr');
var HttpResult = require('dw/svc/Result');
var Resource = require('dw/web/Resource');

/* Script Modules */
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var oauth = require('~/cartridge/scripts/services/oauth');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('BoltAccount');

/**
 * Clear shipping information in basket
 * @param {dw.order.Basket} basket - SFCC basket object
 * @returns {void} - no return data
 */
var clearShippingInformationInBasket = function (basket) {
    var shipments = basket.getShipments();
    // Reset shipping information
    collections.forEach(shipments, function (shipment) {
        Transaction.wrap(function () {
            shipment.createShippingAddress();
            shipment.setShippingMethod(ShippingMgr.getDefaultShippingMethod());
        });
        // Clear shipping price adjustments since shipping method is reset
        var shippingLineItems = shipment.getShippingLineItems();
        collections.forEach(shippingLineItems, function (shippingLineItem) {
            var priceAdjustments = shippingLineItem.getShippingPriceAdjustments();
            collections.forEach(priceAdjustments, function (priceAdjustment) {
                shippingLineItem.removeShippingPriceAdjustment(priceAdjustment);
            });
        });
    });
    // Re-calculate basket since shipping price adjustment might be removed
    Transaction.wrap(function () {
        basket.custom.boltShippingAddress = null;
        basketCalculationHelpers.calculateTotals(basket);
    });
};

/**
 * Clear billing information in basket
 * @param {dw.order.Basket} basket - SFCC basket object
 * @returns {void} - no return data
 */
var clearBillingInformationInBasket = function (basket) {
    // Reset billing address information
    Transaction.wrap(function () {
        basket.createBillingAddress();
        basket.custom.boltPaymentMethods = null;
    });
    // Clear all BOLT_PAY payments
    var boltPaymentInstruments = basket.getPaymentInstruments('BOLT_PAY');
    Transaction.wrap(function () {
        collections.forEach(boltPaymentInstruments, function (boltPI) {
            basket.removePaymentInstrument(boltPI);
        });
    });
};

/**
 * Clear bolt user account information in basket
 * @returns {void} - no return data
 */
exports.clearBoltSessionData = function () {
    delete session.custom.boltOauthToken;
    delete session.custom.boltRefreshToken;
    delete session.custom.boltRefreshTokenScope;
    delete session.custom.boltOauthTokenExpire;
};

/**
 * Wrapper function to clear all bolt user related data
 * @returns {void} - no return data
 */
exports.clearShopperDataInBasket = function () {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return;
    }
    clearShippingInformationInBasket(currentBasket);
    clearBillingInformationInBasket(currentBasket);
};

/**
 * Check if the shopper log in as bolt user
 * @returns {boolean} - if bolt user returns true otherwise false
 */
exports.loginAsBoltUser = function () {
    return session.custom.boltOauthToken !== null;
};

/*
 * Save new credit card information to Bolt
 * @param {dw.order.Order} order - SFCC order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - SFCC payment instrument object
 * @returns {Object} status - indicate if save card process is success or not
 */
exports.saveCardToBolt = function (order, paymentInstrument) {
    try {
        var boltOauthToken = oauth.getOauthToken();
        if (empty(boltOauthToken)) {
            let errorMsg = 'Bolt Oauth Token is missing';
            log.error(errorMsg);
            return {
                success: false,
                message: errorMsg
            };
        }
        var bearerToken = 'Bearer '.concat(boltOauthToken);
        var billingAddress = order.getBillingAddress();
        var expMonth = paymentInstrument.getCreditCardExpirationMonth().toString();
    
        // format month value if needed
        if (expMonth.length === 1) {
            expMonth = '0' + expMonth;
        }
    
        // create request body for add payment method API call
        var request = {
            token: paymentInstrument.getCreditCardToken() || '',
            last4: paymentInstrument.getCreditCardNumberLastDigits() || '',
            bin: paymentInstrument.custom.boltCardBin || '',
            expiration: (paymentInstrument.getCreditCardExpirationYear() + '-' + expMonth) || '',
            postal_code: billingAddress.getPostalCode() || '',
            billing_address: {
                street_address1: billingAddress.getAddress1() || '',
                street_address2: billingAddress.getAddress2() || '',
                locality: billingAddress.getCity() || '',
                region: billingAddress.getStateCode() || '',
                postal_code: billingAddress.getPostalCode() || '',
                country_code: billingAddress.getCountryCode().getValue().toString(),
                country: billingAddress.getCountryCode().getDisplayValue() || '',
                first_name: billingAddress.getFirstName() || '',
                last_name: billingAddress.getLastName() || '',
                phone: billingAddress.getPhone() || ''
            },
            network: paymentInstrument.getCreditCardType() || '',
            token_type: paymentInstrument.custom.boltTokenType || ''
        };
    
        // send add payment method request to Bolt
        var response = boltHttpUtils.restAPIClient(constants.HTTP_METHOD_POST, constants.ADD_PAYMENT_URL, JSON.stringify(request), '', bearerToken);
        if(response.status === HttpResult.OK && response.result !== null){
            return {
                success: true,
                newPaymentMethodID: response.result.id
            };
        } else {
            let errorMsg = Resource.msg('error.add.payment.method', 'bolt', null) + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : '');
            log.error(errorMsg);
            return {
                success: false,
                message: errorMsg
            };
        }
    } catch (e) {
        log.error(e.message);
        return {
            success: false,
            message: e.message
        };
    }
};

/**
 * Save new address to Bolt or update existing Bolt address
 * @param {dw.order.Order} order - SFCC order object
 */
exports.saveAddressToBolt = function (order) {
    try {
        var shippingAddress = order.getDefaultShipment().getShippingAddress();

        // add bolt address id to endpoint if shopper is updating existing address
        var addressUrl = shippingAddress.custom.boltAddressId ? (constants.SHOPPER_ADDRESS_URL + "/" + shippingAddress.custom.boltAddressId) : constants.SHOPPER_ADDRESS_URL;

        var request = {
            street_address1: shippingAddress.address1 || "",
            street_address2: shippingAddress.address2 || "",
            locality: shippingAddress.city || "",
            region: shippingAddress.stateCode || "",
            postal_code: shippingAddress.postalCode || "",
            country_code: shippingAddress.countryCode.value || "",
            first_name: shippingAddress.firstName || "",
            last_name: shippingAddress.lastName || "",
            phone: shippingAddress.phone || ""
        }

        var boltOauthToken = oauth.getOauthToken();
        if (empty(boltOauthToken)) {
            let errorMsg = 'Bolt Oauth Token is missing';
            log.error(errorMsg);
            return {
                success: false,
                message: errorMsg
            };
        }
        var bearerToken = "Bearer ".concat(boltOauthToken);

        // send save address request to Bolt
        var response = boltHttpUtils.restAPIClient(constants.HTTP_METHOD_POST, addressUrl, JSON.stringify(request), '', bearerToken);
        var errorMsg = Resource.msg('error.save.address', 'bolt', null)
        if (response.status && response.status === HttpResult.ERROR) {
            log.error(errorMsg + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : "") );
        }
    } catch (e) {
        log.error(e.message);
    }
}
/**
 * Get bolt payment data which is stored in SFCC basket
 * @param {dw.order.Basket} basket - the SFCC basket
 * @return {Object} null or selected bolt payment data object
 */
 exports.getBoltPayment = function(basket, selectedBoltPaymentID){
    if(empty(basket)|| empty(basket.custom.boltPaymentMethods)) {
        return null;
    }
    var boltPayments = JSON.parse(basket.custom.boltPaymentMethods);
    for (var i=0; i < boltPayments.length; i++) {
        if(boltPayments[i].id === selectedBoltPaymentID){
            return boltPayments[i];
        }
    }
    return null;
}

/**
 * Check if any required address data is missing
 * @param {dw.order.OrderAddress} address - SFCC address object
 * @return {boolean} true if any data is empty otherwise false
 */
exports.isAnyAddressDataMissing = function (address) {
    if (this.checkEmptyValue([
        address.phone || '',
        address.firstName || '',
        address.lastName || '',
        address.address1 || '',
        address.city || '',
        address.stateCode || '',
        address.countryCode.value || '',
        address.postalCode || ''
    ])){
        return true;
    }
    return false;
}

exports.checkEmptyValue = function (list) {
    return list.includes('');
}


/**
 * Check if it is a empty SFCC address object
 * @param {dw.order.OrderAddress} address - SFCC address object
 * @return {boolean} true if all the fields are empty otherwise false
 */
exports.isEmptyAddress = function(address) {
    if (address === null) {
        return true;
    }
    return [
        address.firstName,
        address.lastName,
        address.address1,
        address.city,
        address.stateCode,
        address.countryCode && address.countryCode.value ? address.countryCode.value : null,
        address.postalCode,
        address.phone
    ].every(function(field){
        return field === null;
    })
}