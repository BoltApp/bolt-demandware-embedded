'use strict';

var base = require('base/checkout/billing');
var cleave = require('base/components/cleave');

/**
 * Overwrite updatePaymentInformation in order to add logic to handle Bolt Payment
 * @param {Object} order - checkout model to use as basis of new truth
 */
base.methods.updatePaymentInformation = function(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {
        for (var paymentInstrument of order.billing.payment.selectedPaymentInstruments) {
            if (paymentInstrument.paymentMethod === "BOLT_PAY") {
                htmlToAppend += '<div class="credit-card-type"><span>'
                    + paymentInstrument.type
                    + '</span><div class="credit-card-number"><span>'
                    + paymentInstrument.lastFour
                    + '</span></div><div class="credit-card-expiration-date"><span>'
                    + paymentInstrument.expirationMonth
                    + '/' + paymentInstrument.expirationYear
                    + '</span></div>';
            }else if(paymentInstrument.paymentMethod === "CREDIT_CARD"){
                htmlToAppend += '<span>' + order.resources.cardType + ' '
                + order.billing.payment.selectedPaymentInstruments[0].type
                + '</span><div>'
                + order.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber
                + '</div><div><span>'
                + order.resources.cardEnding + ' '
                + order.billing.payment.selectedPaymentInstruments[0].expirationMonth
                + '/' + order.billing.payment.selectedPaymentInstruments[0].expirationYear
                + '</span></div>';
            }
        }
    }
    $paymentSummary.empty().append(htmlToAppend);
};

// Overwrite handleCreditCardNumber function, add null check logic since Bolt Payment 
// does not use default card number field
base.handleCreditCardNumber = function () {
    if ($('.cardNumber').length && $('#cardType').length) {
      cleave.handleCreditCardNumber('.cardNumber', '#cardType');
    }
};

// Overwrite validateAndUpdateBillingPaymentInstrument function,
// Add logic to by pass the logic which is specific for basic credit card
// Otherwise it will generate console error.
base.methods.validateAndUpdateBillingPaymentInstrument = function(order){
    var billing = order.billing;
    if (!billing.payment || !billing.payment.selectedPaymentInstruments
        || billing.payment.selectedPaymentInstruments.length <= 0) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    var instrument = billing.payment.selectedPaymentInstruments[0];
    if(instrument.paymentMethod === "CREDIT_CARD"){
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
        // Force security code and card number clear
        $('input[name$=securityCode]', form).val('');
        $('input[name$=cardNumber]').data('cleave').setRawValue('');
    }
}

module.exports = base;