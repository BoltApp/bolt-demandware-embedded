'use strict';

module.exports = {
    creditCardNumber: '411111111111',
    creditCardType: 'visa',
    creditCardExpirationMonth: 3,
    creditCardExpirationYear: 30,
    custom: {
        boltCardBin : '4111',
        boltTokenType : ''
    },
    getCreditCardToken() {
        return '411111111111';
    },
    getCreditCardNumberLastDigits() {
        return '1111';
    },
    getCreditCardExpirationYear() {
        return this.creditCardExpirationYear;
    },
    getCreditCardExpirationMonth() {
        return this.creditCardExpirationMonth;
    },
    getCreditCardType() {
        return this.creditCardType;
    }
};