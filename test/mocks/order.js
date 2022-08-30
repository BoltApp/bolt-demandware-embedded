'use strict';

module.exports = {
    getBillingAddress(){
        return {
            getPostalCode(){
                return '02135';
            },
            getAddress1(){
                return '65 May Lane';
            },
            getAddress2(){
                return '';
            },
            getCity(){
                return 'Allston';
            },
            getStateCode(){
                return 'MA';
            },
            getCountryCode(){
                return {
                    getDisplayValue(){
                        return 'United States';
                    },
                    getValue(){
                        return 'US';
                    }
                }
            },
            getFirstName(){
                return 'Amanda';
            },
            getLastName(){
               return 'Jones';
            },
            getPhone(){
                return '617-555-1234';
            }
        }
    },
    getDefaultShipment(){
        return {
            getShippingAddress(){
                return {
                    address1 : 'address1',
                    address2 : '',
                    city : 'city',
                    stateCode : 'MA',
                    postalCode : '02135',
                    countryCode :  { value: 'us' },
                    firstName : 'firstName',
                    lastName : 'lastName',
                    phone : '617-555-1234',
                    custom:{
                        boltAddressId : 'boltAddressId'
                    }
                };
            },
            isGift(){
                return false;
            }
        }
    }
};