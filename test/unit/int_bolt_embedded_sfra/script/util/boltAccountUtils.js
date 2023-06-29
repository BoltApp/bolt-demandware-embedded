'use strict';

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var BasketMgr = require('../../../../mocks/dw/order/BasketMgr');
var ArrayList = require('../../../../mocks/dw.util.Collection.js');

var collections = proxyquire(
    '../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections',
    {
        'dw/util/ArrayList': ArrayList
    }
);

/* Global SFCC object mock */
global.session = {
    privacy: {}
};

/**
 * Set Bolt OAuth Data in SFCC session
 */
var setBoltUserDataInSession = function (){
    session.privacy.boltOAuthToken = 'boltOAuthToken';
    session.privacy.boltRefreshToken = 'boltRefreshToken';
    session.privacy.boltRefreshTokenScope = 'boltRefreshTokenScope';
    session.privacy.boltOAuthTokenExpire = 'boltOAuthTokenExpire';
}

/**
 * Clear Bolt OAuth Data in SFCC session
 */
var clearBoltUserDataInSession = function (){
    session.privacy.boltOAuthToken = null;
    session.privacy.boltRefreshToken = null;
    session.privacy.boltRefreshTokenScope = null;
    session.privacy.boltOAuthTokenExpire = null;
}



describe('boltAccountUtils', function () {
    var boltAccountUtils, address;
    var responseMock = {};
    var oAuthTokenMock;

    // Add spy to log counts of triggering log.error
    var logErrorSpy = sinon.spy();
    var boltLogUtilsMock = {
            getLogger() {
                return {
                    debug() {},
                    warn() {},
                    info() {},
                    error : logErrorSpy
                };
            }
        };
    var boltAccountUtilsPath = '../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/boltAccountUtils';
    var boltAccountUtilsRequires = {
        /* API Includes */
        'dw/order/BasketMgr': require('../../../../mocks/dw/order/BasketMgr'),
        'dw/system/Transaction': require('../../../../mocks/dw/system/Transaction'),
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/ShippingMgr': require('../../../../mocks/dw/order/ShippingMgr'),
        'dw/svc/Result' : require('../../../../mocks/dw/svc/Result'),
        'dw/web/Resource' : require('../../../../mocks/dw/web/Resource'),
        /* Script Modules */
        '*/cartridge/scripts/helpers/basketCalculationHelpers': {
            calculateTotals(){},
        },
        '~/cartridge/scripts/services/httpUtils' : {
            restAPIClient(){
                return responseMock;
            }
        },
        '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/services/oAuth' : {
            getOAuthToken() {
                return oAuthTokenMock;
            }
        },
        '~/cartridge/scripts/util/boltLogUtils': boltLogUtilsMock,
    };
    beforeEach(function () {
        boltAccountUtils = proxyquire(boltAccountUtilsPath, boltAccountUtilsRequires);
        address = {
            firstName : 'firstName',
            lastName : 'lastName',
            address1 : 'address1',
            city : 'city',
            stateCode : 'stateCode',
            countryCode : {
                value : 'US'
            },
            postalCode : 'postalCode',
            phone : 'phone'
        };
    });

    describe('loginAsBoltUser', function () {
        it('should return true if a shopper is using Bolt Account', function () {
            setBoltUserDataInSession();
            var loginAsBoltUser = boltAccountUtils.loginAsBoltUser();
            assert.equal(loginAsBoltUser, true);
        });

        it('should return false if a shopper is not using Bolt Account.', function () {
            clearBoltUserDataInSession();
            var loginAsBoltUser = boltAccountUtils.loginAsBoltUser();
            assert.equal(loginAsBoltUser, false);
        });
    });

    describe('isEmptyAddress', function () {

        it('should return true if address object is null.', function () {
            var nullAddress = null;
            var isEmptyAddress = boltAccountUtils.isEmptyAddress(nullAddress);
            assert.equal(isEmptyAddress, true);
        });

        it('should return true if all the address fields are empty.', function () {
            var emptyAddress = {
                firstName : null,
                lastName : null,
                address1 : null,
                city : null,
                stateCode : null,
                countryCode : null,
                postalCode : null,
                phone : null
            };
            var isEmptyAddress = boltAccountUtils.isEmptyAddress(emptyAddress);
            assert.equal(isEmptyAddress, true);
        });

        it('should return false if the address is filled.', function () {
            var isEmptyAddress = boltAccountUtils.isEmptyAddress(address);
            assert.equal(isEmptyAddress, false);
        });
    });

    describe('isAnyAddressDataMissing', function () {

        it('should return true if any address field value is missing.', function () {
            address.phone = null;
            var checkEmptyValue = boltAccountUtils.isAnyAddressDataMissing(address);
            assert.equal(checkEmptyValue, true);
        });

        it('should return false if all address field values are filled.', function () {
            var checkEmptyValue = boltAccountUtils.isAnyAddressDataMissing(address);
            assert.equal(checkEmptyValue, false);
        });
    });

    describe('getBoltPayment', function () {

        it('should return the expected payment object with payment ID.', function () {
            var currentBasket = BasketMgr.getCurrentBasket();
            currentBasket.custom.boltPaymentMethods = JSON.stringify([
                {
                    "id": "qwerty",
                    "type": "card",
                    "last4": "1111",
                    "billing_address": {
                        "id": "AS6qPzMfNCdC2",
                        "street_address1": "111 Broadway",
                        "locality": "New York",
                        "region": "New York",
                        "region_code": "NY",
                        "postal_code": "10006",
                        "country_code": "US",
                        "name": "serena test",
                        "first_name": "first",
                        "last_name": "last"
                    },
                    "network": "visa",
                    "default": true,
                    "exp_month": 3,
                    "exp_year": 2030
                },
                {
                    "id": "asdfgh",
                    "type": "card",
                    "last4": "1111",
                    "billing_address": {
                        "id": "ASh5fVUyPtk9j",
                        "street_address1": "111 Broadway",
                        "locality": "New York",
                        "region": "New York",
                        "region_code": "NY",
                        "postal_code": "10006",
                        "country_code": "US",
                        "country": "United States",
                        "name": "aa bb",
                        "first_name": "aa",
                        "last_name": "bb",
                        "phone_number": "15515555555",
                        "email_address": "test@bolt.com"
                    },
                    "network": "visa",
                    "default": false,
                    "exp_month": 10,
                    "exp_year": 2030
                }
            ]);
            var boltPayment = boltAccountUtils.getBoltPayment(currentBasket, 'qwerty');
            expect(boltPayment.id).to.be.equal('qwerty');
        });

        it('should return null if not able to find the expected payment object.', function () {
            var currentBasket = BasketMgr.getCurrentBasket();
            var boltPayment = boltAccountUtils.getBoltPayment(currentBasket, 'qwerty');
            expect(boltPayment).to.be.null;
        });

    });

    describe('clearBoltSessionData', function () {

        it('should have no bolt related data in SFCC session', function () {
            setBoltUserDataInSession();
            boltAccountUtils.clearBoltSessionData();
            expect(empty(session.privacy.boltOAuthToken)).to.be.true;
            expect(empty(session.privacy.boltRefreshToken)).to.be.true;
            expect(empty(session.privacy.boltRefreshTokenScope)).to.be.true;
            expect(empty(session.privacy.boltOAuthTokenExpire)).to.be.true;
        });
    });

    describe('saveCardToBolt', function () {
        var order, paymentInstrument;
        beforeEach(function () {
            order = require('../../../../mocks/order');
            paymentInstrument = require('../../../../mocks/paymentInstrument');
            oAuthTokenMock = 'oAuthToken';
            logErrorSpy.resetHistory();
        });

        it('should return error if OAuth token is missing', function () {
            oAuthTokenMock = null;
            var res = boltAccountUtils.saveCardToBolt(order, paymentInstrument);
            expect(res.success).to.be.false;
            expect(res.message).to.contain('Bolt OAuth Token is missing');
            expect(logErrorSpy.callCount).to.be.equal(1);
        });

        it('should save card to bolt shopper account', function () {
            responseMock = {
                status : 0,
                result : {
                    id : 'id'
                }
            };
            var res = boltAccountUtils.saveCardToBolt(order, paymentInstrument);
            expect(res.success).to.be.true;
            expect(res.newPaymentMethodID).to.not.be.null;
        });

        it('should return error message if there is an issue saving card to bolt shopper account', function () {
            responseMock = {
                status : 1,
                errors : [
                    {
                        message : 'not able to save card due to an error'
                    }
                ]
            };
            var res = boltAccountUtils.saveCardToBolt(order, paymentInstrument);
            expect(res.success).to.be.false;
            expect(res.message).to.contain('not able to save card due to an error');
        });

        it('should throw error and handled by catch logic', function () {
            order.getBillingAddress = function (){
                throw new Error('Not able to get Billing Address');
            };
            var res = boltAccountUtils.saveCardToBolt(order, paymentInstrument);
            expect(res.success).to.be.false;
            expect(res.message).to.be.equal('Not able to get Billing Address');
        });

    });

    describe('clearShopperDataInBasket', function () {
        beforeEach(function () {
            oAuthTokenMock = 'oAuthToken';
            logErrorSpy.resetHistory();
        });

        it('should clear shipping data and billing data in basket.', function () {
            boltAccountUtils.clearShopperDataInBasket();
            expect(logErrorSpy.callCount).to.be.equal(0);
        });
    });

});