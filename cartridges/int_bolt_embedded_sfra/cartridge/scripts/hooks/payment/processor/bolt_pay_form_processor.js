'use strict';

// API Includes
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');

// Script includes
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');

/**
 * Verify the required information in billing form is provided.
 * @param {Object} req - request object
 * @param {Object} paymentForm - payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var formFieldErrors = {};
    var viewData = viewFormData;

    var billingForm = req.form;

    // validate billing address form
    var billingFormErrors = COHelpers.validateBillingForm(
        paymentForm.addressFields
    );
    if (Object.keys(billingFormErrors).length) {
        Object.keys(billingFormErrors).forEach(function (key) {
            formFieldErrors[key] = billingFormErrors[key];
        });
    }

    if (Object.keys(formFieldErrors).length) {
        return {
            error: true,
            fieldErrors: formFieldErrors
        };
    }

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    var expMonthAndYear = billingForm.expiration.split('-');

    viewData.paymentInformation = {
        cardType: billingForm.network || '',
        expirationMonth: parseInt(expMonthAndYear[1], 10),
        expirationYear: parseInt(expMonthAndYear[0], 10),
        creditCardToken: billingForm.token || '',
        bin: billingForm.bin || '',
        lastFourDigits: billingForm.last4 || '',
        createAccount: billingForm.create_bolt_account === 'true'
    };

    // if returning Bolt shopper selects a stored card, use Bolt payment method ID.
    if (boltAccountUtils.loginAsBoltUser() && req.form.selectedBoltPaymentID) {
        viewData.selectedBoltPaymentID = req.form.selectedBoltPaymentID;
    }

    return {
        error: false,
        viewData: viewData
    };
}

module.exports = {
    processForm: processForm
};
