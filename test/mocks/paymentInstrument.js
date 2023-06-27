'use strict';

module.exports = {
    creditCardNumber: '411111111111',
    creditCardType: 'visa',
    creditCardExpirationMonth: 3,
    creditCardExpirationYear: 30,
    custom: {
        boltCardBin : '4111',
        boltTokenType : '',
        boltPaymentMethodId : '8888888888'
    },
    paymentTransaction : {
        paymentProcessor : '',
        transactionID : '',
        amount: {
            value: 10.00,
            getValue(){
                return this.value;
            }
        },
        setPaymentProcessor(val){
            this.paymentProcessor = val;
        },
        setTransactionID(val){
            this.transactionID = val;
        },
        getAmount(){
            return this.amount;
        }

    },
    getPaymentTransaction() {
        return this.paymentTransaction;
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