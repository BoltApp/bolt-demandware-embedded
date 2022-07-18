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
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Shipping');

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
    delete session.privacy.boltOauthToken;
    delete session.privacy.boltRefreshToken;
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
    return session.privacy.boltOauthToken !== null;
};

/**
 * Update Bolt address in basket after saving address to Bolt
 * @param {string} boltAddressId  - current bolt address id, will be empty if shopper is adding a new address to Bolt
 * @param {Object} newAddress - new added or updated address returned from Bolt
 * @returns 
 */
exports.updateBasketBoltaddress = function (boltAddressId, newAddress) {
    if (!newAddress) return;

    try {
        var currentBasket = BasketMgr.getCurrentBasket();
        var boltShippingAddress = currentBasket.custom.boltShippingAddress ? JSON.parse(currentBasket.custom.boltShippingAddress) : new Object();
        
        // update bolt address ID after editing existing address
        if (boltAddressId) {
            for (let i=0; i<boltShippingAddress.length; i++) {
                if (boltShippingAddress[i].id == boltAddressId) {
                    boltShippingAddress[i] = newAddress;
                    break;
                }
            }
        } else {
            // add new added bolt address to basket
            boltShippingAddress.push(newAddress);
        }

        Transaction.wrap(function () {
            currentBasket.custom.boltShippingAddress = JSON.stringify(boltShippingAddress);
        });

        return {error: false};
    } catch (e) {
        return {
            error: true,
            errorMsg: e.message
        };
    }
}

/*
 * Save new credit card information to Bolt
 * @param {dw.order.Order} order - SFCC order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - SFCC payment instrument object
 * @returns {Object} status - indicate if save card process is success or not
 */
exports.saveCardToBolt = function (order, paymentInstrument) {
    if (empty(session.privacy.boltOauthToken)) {
        let errorMsg = 'Bolt Oauth Token is missing';
        log.error(errorMsg);
        return {
            success: false,
            message: errorMsg
        };
    }

    var billingAddress = order.getBillingAddress();
    var bearerToken = 'Bearer '.concat(session.privacy.boltOauthToken);
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
    if (response.status && response.status === HttpResult.ERROR) {
        let errorMsg = Resource.msg('error.add.payment.method', 'bolt', null) + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : '');
        // double check the error data format
        log.error(errorMsg);
        return {
            success: false,
            message: errorMsg
        };
    }
    return {
        success: true
    };
};
