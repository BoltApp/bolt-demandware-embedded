'use strict';

// API Includes
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMgr = require('dw/order/ShippingMgr');
var HttpResult = require('dw/svc/Result');
var Resource = require('dw/web/Resource');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/* Script Modules */
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var oAuth = require('~/cartridge/scripts/services/oAuth');
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
    delete session.privacy.boltOAuthToken;
    delete session.privacy.boltRefreshToken;
    delete session.privacy.boltRefreshTokenScope;
    delete session.privacy.boltOAuthTokenExpire;
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
    return session.privacy.boltOAuthToken !== null;
};

/*
 * Save new credit card information to Bolt
 * @param {dw.order.Order} order - SFCC order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - SFCC payment instrument object
 * @returns {Object} status - indicate if save card process is success or not
 */
exports.saveCardToBolt = function (order, paymentInstrument) {
    try {
        var errorMsg;
        var boltOAuthToken = oAuth.getOAuthToken();
        if (empty(boltOAuthToken)) {
            errorMsg = 'Bolt OAuth Token is missing';
            log.error(errorMsg);
            return {
                success: false,
                message: errorMsg
            };
        }
        var bearerToken = 'Bearer '.concat(boltOAuthToken);
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
        var response = boltHttpUtils.restAPIClient(
            constants.HTTP_METHOD_POST,
            constants.ADD_PAYMENT_URL,
            JSON.stringify(request),
            constants.CONTENT_TYPE_JSON,
            bearerToken
        );
        if (response.status === HttpResult.OK && response.result !== null) {
            log.info('card succesfully added to bolt');
            return {
                success: true,
                newPaymentMethodID: response.result.id
            };
        }
        // eslint-disable-next-line no-undef
        errorMsg = Resource.msg('error.add.payment.method', 'bolt', null) + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : '');
        log.error(errorMsg);
        return {
            success: false,
            message: errorMsg
        };
    } catch (e) {
        log.error(e.message);
        return {
            success: false,
            message: e.message
        };
    }
};

/**
 * Get bolt payment data which is stored in SFCC basket
 * @param {dw.order.Basket} basket - the SFCC basket
 * @param {string} selectedBoltPaymentID - selected Bolt Payment ID
 * @return {Object} null or selected bolt payment data object
 */
exports.getBoltPayment = function (basket, selectedBoltPaymentID) {
    if (empty(basket) || empty(basket.custom.boltPaymentMethods)) {
        return null;
    }
    var selectedBoltPayment = null;
    var boltPayments = JSON.parse(basket.custom.boltPaymentMethods);
    boltPayments.forEach(function (boltPayment) {
        if (boltPayment.id === selectedBoltPaymentID) {
            selectedBoltPayment = boltPayment;
        }
    });
    return selectedBoltPayment;
};

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
    ])) {
        return true;
    }
    return false;
};

exports.checkEmptyValue = function (list) {
    return list.includes('');
};

/**
 * Check if it is a empty SFCC address object
 * @param {dw.order.OrderAddress} address - SFCC address object
 * @return {boolean} true if all the fields are empty otherwise false
 */
exports.isEmptyAddress = function (address) {
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
    ].every(function (field) {
        return field === null;
    });
};

/**
 * Save Bolt addresses to SFCC customer account
 * @param {dw.customer.Customer} customer 
 * @param {Object} boltAddresses 
 */
exports.saveBoltAddress = function(customer, boltAddresses) {
    var addressBook = customer.getProfile().getAddressBook();

    try {
        for (var idx in boltAddresses) {
            var addressName = generateAddressName(boltAddresses[idx]);
            Transaction.wrap(function () {
                var newAddress = addressBook.createAddress(addressName);
                updateAddressFields(newAddress, boltAddresses[idx]);
            });
        }
    } catch (e) {
        log.error(e.message);
        return false;
    }
    
    return true;
}

function generateAddressName(boltAddress) {
    return [(boltAddress.street_address1 || ''), (boltAddress.locality || ''), (boltAddress.postal_code || '')].join(' - ');
}

function updateAddressFields(newAddress, boltAddress) {
    newAddress.setAddress1(boltAddress.street_address1 || '');
    newAddress.setAddress2(boltAddress.street_address2 || '');
    newAddress.setCity(boltAddress.locality || '');
    newAddress.setFirstName(boltAddress.first_name || '');
    newAddress.setLastName(boltAddress.last_name || '');
    newAddress.setPhone(boltAddress.phone || '');
    newAddress.setPostalCode(boltAddress.postal_code || '');
    newAddress.setCompanyName(boltAddress.company || '');

    if (boltAddress.region) {
        newAddress.setStateCode(boltAddress.region);
    }
    if (boltAddress.country_code) {
        newAddress.setCountryCode(boltAddress.country_code);
    }
}

exports.saveBoltPayments = function(customer,boltPayments) {
    var wallet = customer.getProfile().getWallet();
    try {
        for (let idx in boltPayments) {
            var boltPayment = boltPayments[idx];
            if (boltPayment['.tag'] == constants.PAYMENT_METHOD_CREDIT_CARD) {
                Transaction.wrap(function () {
                    var paymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
                    paymentInstrument.setCreditCardNumber(constants.CC_MASKED_DIGITS + boltPayment.last4);
                    paymentInstrument.setCreditCardType(boltPayment.network || '');
                    if (boltPayment.expiration) {
                        // in YYYY-MM format
                        var expiration = boltPayment.expiration.split('-');
                        paymentInstrument.setCreditCardExpirationYear(parseInt(expiration[0]));
                        paymentInstrument.setCreditCardExpirationMonth(parseInt(expiration[1]));
                    }
                    var billingAddress = boltPayment.billing_address;
                    var fullName = (billingAddress.first_name || '') + ' ' + (billingAddress.last_name || '');
                    paymentInstrument.setCreditCardHolder(fullName);
                    paymentInstrument.setCreditCardToken(boltPayment.token || '');
                })
            }
        }
    } catch (e) {
        log.error(e.message);
        return false;
    }

    return true;
}