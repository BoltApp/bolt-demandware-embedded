'use strict';

function checkEmptyValue() {
    return false;
}

function getBoltPayment() {
    return {
        last4 : '1111',
        network : 'visa',
        exp_month : '3',
        exp_year : '2023',
    };
}

function saveCardToBolt() {
    return {
        success: true,
        newPaymentMethodID: 'newPaymentMethodID'
    }
}

function saveAddressToBolt() {
    
}

module.exports = {
    checkEmptyValue: checkEmptyValue,
    getBoltPayment: getBoltPayment,
    saveCardToBolt: saveCardToBolt,
    saveAddressToBolt: saveAddressToBolt
};