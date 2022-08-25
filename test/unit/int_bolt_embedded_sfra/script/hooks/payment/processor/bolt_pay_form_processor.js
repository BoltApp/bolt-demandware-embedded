'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var loginAsBoltUserStub = sinon.stub();

var paymentFormMock;
var requestMock = {};
var viewFormDataMock = {};

describe('bolt pay form processor', function () {
    var boltPayFormProcessorFilePath = '../../../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/hooks/payment/processor/bolt_pay_form_processor';
    var requiredModulesMock = {
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            validateBillingForm: function (form) {
                if(form == null){
                    return [{'form_error':'data-missing'}]
                }else{
                    for (let key in form) {
                        if (form[key].value === null && form[key].required === true){
                            return [{'form_error':'data-missing'}];
                        }
                        else{
                            return {};
                        }
                    }
                }
            }
        },
        '~/cartridge/scripts/util/boltAccountUtils': {
            loginAsBoltUser: loginAsBoltUserStub
        }
    };

    describe('processForm', function () {
        beforeEach(function () {
            var boltCreditCardMock = {
                selectedBoltPaymentID: {
                    value: null,
                    required: false
                },
                expiration: {
                    value: '2023-10',
                    required: true
                },
                network:{
                    value: 'visa',
                    required: true
                },
                token:{
                    value: '1234567890',
                    required: true
                },
                bin:{
                    value: '4111',
                    required: true
                },
                lastDigits:{
                    value: '1111',
                    required: true
                },
                tokenType:{
                    value: 'tokenType',
                    required: true
                },
                createAccount:{
                    value: true,
                    required: false
                }
            };
            paymentFormMock = {
                paymentMethod: {
                    value: 'BOLT_PAY'
                },
                addressFields: {
                    address1:{
                        value: 'address1',
                        required: true
                    },
                    address2:{
                        value: 'address2',
                        required: true
                    },
                    city:{
                        value: 'city',
                        required: true
                    },
                    state:{
                        value: 'state',
                        required: false
                    },
                    country:{
                        value: 'country',
                        required: true
                    },
                    postalCode:{
                        value: 'postalCode',
                        required: true
                    },
                },
                boltCreditCard: boltCreditCardMock
            };

        });
        it('Should process credit card token for bolt guest user', function () {
            loginAsBoltUserStub.returns(false);
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.isFalse(result.error);
            assert.equal(result.viewData.paymentInformation.cardType, 'visa');
            assert.equal(result.viewData.paymentInformation.expirationYear, '2023');
            assert.equal(result.viewData.paymentInformation.expirationMonth, '10');
            assert.equal(result.viewData.paymentInformation.creditCardToken, '1234567890');
            assert.equal(result.viewData.paymentInformation.bin, '4111');
            assert.equal(result.viewData.paymentInformation.lastFourDigits, '1111');
            assert.equal(result.viewData.paymentInformation.token_type, 'tokenType');
            assert.equal(result.viewData.paymentMethod.value, 'BOLT_PAY');
            assert.equal(result.viewData.paymentInformation.selectedBoltPaymentID, null);
        });
        it('Should process credit card token for bolt login user if a new credit card is used', function () {
            loginAsBoltUserStub.returns(true);
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.isFalse(result.error);
            assert.equal(result.viewData.paymentInformation.cardType, 'visa');
            assert.equal(result.viewData.paymentInformation.expirationYear, '2023');
            assert.equal(result.viewData.paymentInformation.expirationMonth, '10');
            assert.equal(result.viewData.paymentInformation.creditCardToken, '1234567890');
            assert.equal(result.viewData.paymentInformation.bin, '4111');
            assert.equal(result.viewData.paymentInformation.lastFourDigits, '1111');
            assert.equal(result.viewData.paymentInformation.token_type, 'tokenType');
            assert.equal(result.viewData.paymentMethod.value, 'BOLT_PAY');
            assert.equal(result.viewData.paymentInformation.selectedBoltPaymentID, null);
        });
        it('Should process stored credit card data for bolt login user if an existing credit card is used', function () {
            loginAsBoltUserStub.returns(true);
            paymentFormMock.boltCreditCard.selectedBoltPaymentID.value = 'selectedBoltPaymentID';
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.isFalse(result.error);
            assert.equal(result.viewData.paymentInformation.cardType, null);
            assert.equal(result.viewData.paymentInformation.expirationYear, null);
            assert.equal(result.viewData.paymentInformation.expirationMonth, null);
            assert.equal(result.viewData.paymentInformation.creditCardToken, null);
            assert.equal(result.viewData.paymentInformation.bin, null);
            assert.equal(result.viewData.paymentInformation.lastFourDigits, null);
            assert.equal(result.viewData.paymentInformation.token_type, null);
            assert.equal(result.viewData.paymentMethod.value, 'BOLT_PAY');
            assert.equal(result.viewData.paymentInformation.selectedBoltPaymentID, 'selectedBoltPaymentID');
        });
        it('Should return error if billing address data is missing', function () {
            loginAsBoltUserStub.returns(false);
            paymentFormMock.addressFields = null;
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.isTrue(result.error);
            assert.isTrue('form_error' in result.fieldErrors[0]);
            assert.equal(result.fieldErrors[0]['form_error'], 'data-missing');
        });
        it('Should return error if credit card data is missing', function () {
            loginAsBoltUserStub.returns(false);
            paymentFormMock.boltCreditCard = null;
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.equal(result.fieldErrors[0]['form_error'], 'data-missing');
        });
        it('Should return create account value as false if the shopper is a bolt login user', function () {
            loginAsBoltUserStub.returns(true);
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.equal(result.viewData.paymentInformation.createAccount, false);
        });
        it('Should return create account value as false if the shopper is a bolt guest user and create account checkbox is unchecked', function () {
            loginAsBoltUserStub.returns(false);
            paymentFormMock.boltCreditCard.createAccount = false;
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.equal(result.viewData.paymentInformation.createAccount, false);
        });
        it('Should return create account value as true if the shopper is a bolt guest user and create account checkbox is checked', function () {
            loginAsBoltUserStub.returns(false);
            var boltPayFormProcessor = proxyquire(boltPayFormProcessorFilePath, requiredModulesMock);
            var result = boltPayFormProcessor.processForm(requestMock, paymentFormMock, viewFormDataMock);
            assert.equal(result.viewData.paymentInformation.createAccount, true);
        });
    });
});