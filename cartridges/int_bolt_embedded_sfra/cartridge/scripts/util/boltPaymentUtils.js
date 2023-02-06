'use strict';

// API Includes
var Money = require('dw/value/Money');
/**
 * get amount from gift certificate payment instruments
 * @param {dw.order.LineItemCtnr} lineItemCtnr Order object
 * @return {dw.value.Money} New Amount value
 */
exports.getGiftCertificatesAmount = function (lineItemCtnr) {
    var amount = new Money(0, lineItemCtnr.getCurrencyCode());
    var paymentInstruments = lineItemCtnr.getGiftCertificatePaymentInstruments();

    var iterator = paymentInstruments.iterator();
    var paymentInstrument = null;

    while (iterator.hasNext()) {
        paymentInstrument = iterator.next();
        amount = amount.add(paymentInstrument.getPaymentTransaction().getAmount());
    }

    return amount;
};
