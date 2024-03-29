'use strict';

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

    // validate credit card payment information
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    var boltCreditCardForm = paymentForm.boltCreditCard;
    if (boltAccountUtils.loginAsBoltUser() && boltCreditCardForm.selectedBoltPaymentID.value) {
        // if returning Bolt shopper selects a stored card, use Bolt payment method ID.
        viewData.paymentInformation = {
            selectedBoltPaymentID: boltCreditCardForm.selectedBoltPaymentID.value
        };
    } else {
        var boltCreditCardErrors = COHelpers.validateBillingForm(paymentForm.boltCreditCard);
        if (Object.keys(boltCreditCardErrors).length) {
            return {
                fieldErrors: boltCreditCardErrors,
                error: true
            };
        }

        var expMonthAndYear = boltCreditCardForm.expiration.value.split('-');
        viewData.paymentInformation = {
            cardType: boltCreditCardForm.network.value || '',
            expirationMonth: parseInt(expMonthAndYear[1], 10),
            expirationYear: parseInt(expMonthAndYear[0], 10),
            creditCardToken: boltCreditCardForm.token.value,
            bin: boltCreditCardForm.bin.value,
            lastFourDigits: boltCreditCardForm.lastDigits.value,
            token_type: boltCreditCardForm.tokenType.value
        };
    }

    if (boltAccountUtils.loginAsBoltUser()) {
        viewData.paymentInformation.createAccount = false;
    } else {
        viewData.paymentInformation.createAccount = boltCreditCardForm.createAccount.value === true;
    }

    return {
        error: false,
        viewData: viewData
    };
}

module.exports = {
    processForm: processForm
};
