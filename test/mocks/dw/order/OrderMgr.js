'use strict';

var order = {
    currencyCode : 'USD',
    orderNo : '1111111111',
    customerEmail : 'test@test.com',
    billingAddress : {
        address1 : 'address1',
        address2 : 'address2',
        postalCode : '12345',
        city : 'city',
        stateCode : 'ny',
        countryCode : 'us',
        fullName : 'first last',
        firstName : 'first',
        lastName : 'last',
        phone : '123456789',
        getAddress1() {
            return this.address1;
        },
        getAddress2() {
            return this.address2;
        },
        getCity() {
            return this.city;
        },
        getStateCode() {
            return this.stateCode;
        },
        getPostalCode() {
            return this.postalCode;
        },
        getCountryCode() {
            return {
                getDisplayValue(){
                    return 'United States';
                },
                getValue(){
                    return 'US';
                }
            }
        },
        getFullName() {
            return this.fullName;
        },
        getFirstName() {
            return this.firstName;
        },
        getLastName() {
            return this.lastName;
        },
        getPhone(){
            return this.phone;
        }
    },
    getCustomerEmail() {
        return this.customerEmail;
    },
    getOrderNo() {
        return this.orderNo;
    },
    getBillingAddress() {
        return this.billingAddress;
    }
};


module.exports = {
    getOrder() {
        return order;
    }
};