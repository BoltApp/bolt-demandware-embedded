'use strict';

var chai = require('chai');
var expect = chai.expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');
var basePaymentModelMock = require('../../../mocks/models/base');
var ArrayList = require('../../../mocks/dw.util.Collection.js');
var collections = proxyquire(
    '../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections',
    {
        'dw/util/ArrayList': ArrayList
    }
);

var PaymentModel;

describe('paymentModel', function () {
  var basketMock;
  before(function () {
    basketMock = {};
    mockSuperModule.create(basePaymentModelMock);
    PaymentModel = proxyquire('../../../../cartridges/int_bolt_embedded_sfra/cartridge/models/payment', {
      '*/cartridge/scripts/util/collections': collections
    });
  });

  after(function () {
    mockSuperModule.remove();
  });

  it('should set bolt payment data in payment model', function () {
    basketMock.paymentInstruments = new ArrayList([
      {
          paymentMethod : 'BOLT_PAY',
          paymentTransaction : {
              amount: {
                decimalValue: 10.0,
              },
          },
          creditCardNumberLastDigits : '1111',
          creditCardExpirationMonth : '10',
          creditCardExpirationYear : '2023',
          creditCardType : 'visa',
          maskedCreditCardNumber : '************1111',
      },
    ]);

    var payment = new PaymentModel(basketMock);
    expect(payment.selectedPaymentInstruments[0].paymentMethod).to.be.equal('BOLT_PAY');
    expect(payment.selectedPaymentInstruments[0].lastFour).to.be.equal('1111');
    expect(payment.selectedPaymentInstruments[0].expirationYear).to.be.equal('2023');
    expect(payment.selectedPaymentInstruments[0].expirationMonth).to.be.equal('10');
    expect(payment.selectedPaymentInstruments[0].type).to.be.equal('visa');
    expect(payment.selectedPaymentInstruments[0].maskedCreditCardNumber).to.be.equal('************1111');
  });

  it('should set basic credit card data in payment model', function () {
    basketMock.paymentInstruments = new ArrayList([
      {
          paymentMethod : 'CREDIT_CARD',
          paymentTransaction : {
              amount: {
                decimalValue: 10.0,
              },
          },
          creditCardNumberLastDigits : '1111',
          creditCardExpirationMonth : '10',
          creditCardExpirationYear : '2023',
          creditCardHolder : 'test',
          creditCardType : 'visa',
          maskedCreditCardNumber : '************1111',
      },
    ]);

    var payment = new PaymentModel(basketMock);
    expect(payment.selectedPaymentInstruments[0].paymentMethod).to.be.equal('CREDIT_CARD');
    expect(payment.selectedPaymentInstruments[0].lastFour).to.be.equal('1111');
    expect(payment.selectedPaymentInstruments[0].owner).to.be.equal('test');
    expect(payment.selectedPaymentInstruments[0].expirationYear).to.be.equal('2023');
    expect(payment.selectedPaymentInstruments[0].expirationMonth).to.be.equal('10');
    expect(payment.selectedPaymentInstruments[0].type).to.be.equal('visa');
    expect(payment.selectedPaymentInstruments[0].maskedCreditCardNumber).to.be.equal('************1111');
  });

  it('should set gift certificate data in payment model', function () {
    basketMock.paymentInstruments = new ArrayList([
      {
          paymentMethod : 'GIFT_CERTIFICATE',
          paymentTransaction : {
              amount: {
                decimalValue: 10.0,
              },
          },
          giftCertificateCode : '1234123412341234',
          maskedGiftCertificateCode : '************1234',
      },
    ]);

    var payment = new PaymentModel(basketMock);
    expect(payment.selectedPaymentInstruments[0].giftCertificateCode).to.be.equal('1234123412341234');
    expect(payment.selectedPaymentInstruments[0].maskedGiftCertificateCode).to.be.equal('************1234');
  });

  it('should no set payment data in payment model if payment data is missing in basket', function () {
    basketMock.paymentInstruments = null;
    var payment = new PaymentModel(basketMock);
    expect(payment.selectedPaymentInstruments).to.be.null;
  });

});
