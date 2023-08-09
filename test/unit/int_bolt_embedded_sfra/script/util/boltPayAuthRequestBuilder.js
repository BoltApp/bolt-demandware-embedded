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

var loginAsBoltUserStub = sinon.stub();


describe('boltPayAuthRequestBuilder', function () {
    var boltPayAuthRequestBuilder;
    var boltAccountUtilsMock = require('../../../../mocks/bolt/boltAccountUtils.js');
    boltAccountUtilsMock.loginAsBoltUser = loginAsBoltUserStub;
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
    var boltPayAuthRequestBuilderPath = '../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/boltPayAuthRequestBuilder';
    var boltPayAuthRequestBuilderRequires = {
        /* API Includes */
        'dw/util/StringUtils' : require('../../../../mocks/dw/util/StringUtils'),
        'dw/system/Site' : require('../../../../mocks/dw/system/Site'),
        /* Script Modules */
        '*/cartridge/scripts/util/collections': collections,
        '~/cartridge/scripts/util/boltAccountUtils': boltAccountUtilsMock,
        '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/util/boltLogUtils': boltLogUtilsMock,
    };
    var Order, paymentInstrument;
    Order = require('../../../../mocks/newOrder');

    beforeEach(function () {
        paymentInstrument = require('../../../../mocks/paymentInstrument');
        loginAsBoltUserStub.reset();
        boltPayAuthRequestBuilder = proxyquire(boltPayAuthRequestBuilderPath, boltPayAuthRequestBuilderRequires);
    });

    describe('build', function () {
        it('should return expect auth request body and match all the numbers', function () {
            loginAsBoltUserStub.returns(false);
            var testOrder = new Order();
            var authRequestObj = boltPayAuthRequestBuilder.build(testOrder, paymentInstrument);

            assert.isNotNull(authRequestObj.authRequest);
            var authRequest = authRequestObj.authRequest;
            assert.equal(authRequest.cart.tax_amount, 2800);
            assert.equal(authRequest.cart.discounts[0].amount, 1000);
            assert.equal(authRequest.cart.discounts[1].amount, 22400);
            assert.equal(authRequest.cart.items[0].total_amount, 75996);
            assert.equal(authRequest.cart.items[0].unit_price, 37998);
            assert.equal(authRequest.cart.items[1].total_amount, 2900);
            assert.equal(authRequest.cart.items[1].unit_price, 2900);
            assert.equal(authRequest.cart.shipments[0].cost, 495);
        });

        it('should return error if payment instrument is missing', function () {
            loginAsBoltUserStub.returns(false);
            var testOrder = new Order();
            var authRequestObj = boltPayAuthRequestBuilder.build(testOrder, null);
            assert.isTrue(authRequestObj.error);
            assert.equal(authRequestObj.errorMsg, 'Missing payment instrument.');
            assert.isUndefined(authRequestObj.authRequest);
        });
        it('should return error if billing address is missing', function () {
            loginAsBoltUserStub.returns(false);
            var testOrder = new Order();
            testOrder.getBillingAddress = function(){
                return null;
            }
            var authRequestObj = boltPayAuthRequestBuilder.build(testOrder, paymentInstrument);
            assert.isTrue(authRequestObj.error);
            assert.equal(authRequestObj.errorMsg, 'SFCC basket has not billing address.');
            assert.isUndefined(authRequestObj.authRequest);
        });

    });

});