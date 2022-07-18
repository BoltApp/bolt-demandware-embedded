'use strict';

// API Includes
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMgr = require('dw/order/ShippingMgr');

/* Script Modules */
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

/**
 * Clear shipping information in basket
 * @param {Object} basket - SFCC basket object
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
 * @param {Object} basket - SFCC basket object
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
 * @param {Object} basket - SFCC basket object
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
 * @returns {void} - no return data
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
