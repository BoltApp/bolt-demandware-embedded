var ArrayList = require('../../../mocks/dw.util.Collection');
var ShippingMgr = require('./ShippingMgr');
const shippingAddress = {
    firstName: 'Amanda',
    lastName: 'Jones',
    address1: '65 May Lane',
    address2: '',
    city: 'Allston',
    postalCode: '02135',
    countryCode: { value: 'us' },
    phone: '617-555-1234',
    stateCode: 'MA',
    custom: {},

    setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
    setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
    setAddress1: function (address1Input) { this.address1 = address1Input; },
    setAddress2: function (address2Input) { this.address2 = address2Input; },
    setCity: function (cityInput) { this.city = cityInput; },
    setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
    setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
    setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
    setPhone: function (phoneInput) { this.phone = phoneInput; },
    getPhone: function () {
        return this.phone;
    },
    getCustom: function () { return this.custom; }
};

const paymentInstrument = {
    creditCardNumber: '411111111111',
    creditCardType: 'visa',
    creditCardExpirationMonth: '03',
    creditCardExpirationYear: '30',
    custom: {},
    setCreditCardNumber(number) { this.creditCardNumber = number; },
    setCreditCardType(type) { this.creditCardType = type; },
    setCreditCardExpirationMonth(month) { this.creditCardExpirationMonth = month; },
    setCreditCardExpirationYear(year) { this.creditCardExpirationYear = year; }
};

function getCurrentBasket() {
    return {
        defaultShipment: {
            shippingAddress: shippingAddress
        },
        totalGrossPrice: {
            value: 250.00
        },
        custom: {},
        billingAddress: shippingAddress,
        getShipments() {
            return new ArrayList([
                {
                    getShippingAddress() {
                        return shippingAddress;
                    },
                    getShippingMethod() {
                        return ShippingMgr.getDefaultShippingMethod();
                    },
                    createShippingAddress() {
                        this.ShippingAddress = shippingAddress;
                    },
                    setShippingMethod(shippingMethod) {
                        this.shippingMethod = shippingMethod;
                    },
                    getShippingLineItems(){
                        return new ArrayList([
                            {
                                getShippingPriceAdjustments(){
                                    return new ArrayList([
                                        {
                                            promotionID : 'promotionID'
                                        }
                                    ]);
                                },
                                removeShippingPriceAdjustment(){}
                            }
                        ]);
                    }
                }
            ]);
        },
        getBillingAddress() {
            return shippingAddress;
        },
        setCustomerEmail(email) {
            this.customerEmail = email;
        },
        createBillingAddress() {
            this.billingAddress = shippingAddress;
        },
        getCustom() {
            return this.custom;
        },
        getPaymentInstruments() { return new ArrayList([paymentInstrument]); },
        removePaymentInstrument() {},
        createPaymentInstrument() {
            return paymentInstrument;
        }
    };
}

module.exports = {
    getCurrentBasket: getCurrentBasket
};
