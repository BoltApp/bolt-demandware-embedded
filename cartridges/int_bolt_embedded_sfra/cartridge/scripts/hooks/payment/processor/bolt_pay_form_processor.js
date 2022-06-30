'use strict';

// API Includes
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');

// Script includes
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

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
  
    // validate billing form
    if(!req.form.storedPaymentUUID) {
        var creditCardFormErrors = COHelpers.validateCreditCard(paymentForm);
        if (Object.keys(creditCardFormErrors).length) {
            Object.keys(creditCardFormErrors).forEach(function (key) {
                formFieldErrors[key] = creditCardFormErrors[key];
            });
        }
    }

    if (Object.keys(formFieldErrors).length) {
        return {
            error: true,
            fieldErrors: formFieldErrors
        }
    }
    var cardNumber = paymentForm.creditCardFields.cardNumber.value;
    var cardLastFourDigits = cardNumber.length > 4 ? cardNumber.substring(cardNumber.length - 4, cardNumber.length) : '';  
    var cardBin = cardNumber.length > 6 ? cardNumber.substring(0,6) : '';

    viewData.paymentMethod = paymentForm.paymentMethod.value;       
    viewData.paymentInformation = {
        cardType: paymentForm.creditCardFields.cardType.value,
        cardToken: paymentForm.creditCardFields.token,
        cardLastFourDigits: cardLastFourDigits,
        cardBin: cardBin,
        expirationMonth: parseInt(paymentForm.creditCardFields.expirationMonth.selectedOption, 10),
        expirationYear: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
        createAccount: paymentForm.boltCreateAccount == 'true'
    };

    return {
        error: false,
        viewData: viewData
    };
}

module.exports = {
    processForm: processForm
};
