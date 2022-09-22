'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var BasketMgr = require('../../../../../../mocks/dw/order/BasketMgr');
var ArrayList = require('../../../../../../mocks/dw.util.Collection.js');
const { expect } = require('chai');
var collections = proxyquire(
    '../../../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections',
    {
        'dw/util/ArrayList': ArrayList
    }
);

var loginAsBoltUserStub = sinon.stub();

global.request = {
    getHttpCookies(){
        return {
            0:{
                name : 'dwsid',
                value : 'value'
            },
            cookieCount : 1,
        };
    }
}

describe('bolt pay payment processor', function () {
    var boltPay;
    var boltPayFilePath = '../../../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/hooks/payment/processor/bolt_pay';
    var responseMock = {};
    var boltAccountUtilsMock = require('../../../../../../mocks/bolt/boltAccountUtils.js');
    boltAccountUtilsMock.loginAsBoltUser = loginAsBoltUserStub;
    var requiredModulesMock = {
        /* API Includes */
        'dw/web/Resource' : require('../../../../../../mocks/dw/web/Resource'),
        'dw/system/Transaction' : require('../../../../../../mocks/dw/system/Transaction'),
        'dw/order/OrderMgr' : require('../../../../../../mocks/dw/order/OrderMgr'),
        'dw/util/StringUtils' : require('../../../../../../mocks/dw/util/StringUtils'),
        'dw/system/Site' : require('../../../../../../mocks/dw/system/Site'),
        'dw/svc/Result' : require('../../../../../../mocks/dw/svc/Result'),
        /* Script Modules */
        '*/cartridge/scripts/util/collections': collections,
        '~/cartridge/scripts/services/httpUtils': {
            restAPIClient(){
                return responseMock;
            }
        },
        '~/cartridge/scripts/util/constants':require('../../../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/util/boltAccountUtils': boltAccountUtilsMock,
        '~/cartridge/scripts/util/boltLogUtils':require('../../../../../../mocks/bolt/boltLogUtils')
    };

    beforeEach(function () {
        loginAsBoltUserStub.reset();
        boltPay = proxyquire(boltPayFilePath, requiredModulesMock);
    });

    describe('Handle', function () {
        var paymentInformationMock;
        beforeEach(function () {
            paymentInformationMock = {
                creditCardToken : '999999999999999',
                lastFourDigits : '1111',
                cardType : 'visa',
                expirationMonth : '03',
                expirationYear : '2023',
                bin : '4111',
                token_type : 'bolt',
                createAccount : true
            };
        });

        it('should not return error when setting bolt guest payment information into SFCC payment instrument object.', function () {
            loginAsBoltUserStub.returns(false);
            var currentBasket = BasketMgr.getCurrentBasket();
            var res = boltPay.Handle(currentBasket, paymentInformationMock, 'paymentMethodID', {});
            expect(res.error).to.be.false;
        });

        it('should not return error when setting bolt saved payment information into SFCC payment instrument object.', function () {
            loginAsBoltUserStub.returns(true);
            paymentInformationMock.selectedBoltPaymentID = '8888888888';
            var currentBasket = BasketMgr.getCurrentBasket();
            var res = boltPay.Handle(currentBasket, paymentInformationMock, 'paymentMethodID', {});
            expect(res.error).to.be.false;
        });

        it('should return error if payment info is incomplete for guest checkout.', function () {
            loginAsBoltUserStub.returns(false);
            paymentInformationMock.creditCardToken = null;
            var currentBasket = BasketMgr.getCurrentBasket();
            var res = boltPay.Handle(currentBasket, paymentInformationMock, 'paymentMethodID', {});
            expect(res.error).to.be.true;
        });

        it('should return error if payment info is incomplete for bolt login checkout.', function () {
            loginAsBoltUserStub.returns(true);
            paymentInformationMock.creditCardToken = null;
            paymentInformationMock.selectedBoltPaymentID = null;
            var currentBasket = BasketMgr.getCurrentBasket();
            var res = boltPay.Handle(currentBasket, paymentInformationMock, 'paymentMethodID', {});
            expect(res.error).to.be.true;
        });

    });

    describe('Authorize', function () {
        var paymentInstrument = require('../../../../../../mocks/paymentInstrument.js');

        it('should return error if auth call fails.', function () {
            responseMock = {
                status : 1,
                errors : [
                    {
                        code : '51',
                        message : 'not able to auth the payment.'
                    }
                ]
            };
            loginAsBoltUserStub.returns(false);
            var orderNo = '123456789';
            var res = boltPay.Authorize(orderNo, paymentInstrument, 'BOLT_PAY');
            expect(res.error).to.be.true;
        });

        it('should not return error if auth call succeeds.', function () {
            responseMock = {
                status : 0,
                errors: [],
                result: {}
            };
            loginAsBoltUserStub.returns(true);
            var orderNo = '123456789';
            var res = boltPay.Authorize(orderNo, paymentInstrument, 'BOLT_PAY');
            expect(res.error).to.be.false;
        });

    });
});