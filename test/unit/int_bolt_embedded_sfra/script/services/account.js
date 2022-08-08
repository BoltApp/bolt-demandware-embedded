'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var BasketMgr = require('../../../../mocks/dw/order/BasketMgr');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/dw.util.Collection.js');

var collections = proxyquire(
    '../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections',
    {
        'dw/util/ArrayList': ArrayList
    }
);

describe('account', function () {
    var account;
    var shopperDetails;

    /**
     * verify the billing address is set properly according to account profile
     * @param {dw.order.Basket} currentBasket - current basket
     */
    function verifyBillingAddress(currentBasket) {
        expect(currentBasket.getBillingAddress().address1).to.be.equal('888 main street');
        expect(currentBasket.getBillingAddress().phone).to.be.equal('1-867-5309');
        expect(currentBasket.getBillingAddress().firstName).to.be.equal('Alan');
        expect(currentBasket.getBillingAddress().lastName).to.be.equal('Watts');
        expect(currentBasket.getBillingAddress().city).to.be.equal('Brooklyn');
        expect(currentBasket.getBillingAddress().stateCode).to.be.equal('NY');
        expect(currentBasket.getBillingAddress().countryCode.value).to.be.equal('US');
        expect(currentBasket.getBillingAddress().postalCode).to.be.equal('10044');
        console.log('Billing address is properly populated to the basket according to bolt account!');
    }

    /**
     * verify the payment instruments are set properly according to account profile
     * @param {dw.order.Basket} currentBasket - current basket
     */
    function verifyPaymentInstruments(currentBasket) {
        var paymentInstruments = currentBasket.getPaymentInstruments().toArray();
        paymentInstruments.forEach(function (paymentInstrument) {
            expect(paymentInstrument.custom.boltPaymentMethodId).to.not.be.null;
            expect(paymentInstrument.creditCardNumber).to.be.equal('************4021');
            expect(paymentInstrument.creditCardType).to.be.equal('visa');
            expect(paymentInstrument.creditCardExpirationMonth).to.be.equal('3');
            expect(paymentInstrument.creditCardExpirationYear).to.be.equal('2030');
        });
        console.log('Payment instruments are set properly to the basket according to bolt account');
    }

    /**
     * verify the shipments are set properly according to account profile
     * @param {dw.order.Basket} currentBasket - current basket
     */
    function verifyShipments(currentBasket) {
        var shipments = currentBasket.getShipments().toArray();
        shipments.forEach(function (shipment) {
            var shippingAddress = shipment.getShippingAddress();

            // test that the custom attributes are added to the basket
            expect(shippingAddress.custom.boltAddressID).to.not.be.null;

            // verify the shipping address is set properly according to account details
            expect(shippingAddress.address1).to.be.equal('888 main street');
            expect(shippingAddress.phone).to.be.equal('1-867-5309');
            expect(shippingAddress.firstName).to.be.equal('Alan');
            expect(shippingAddress.lastName).to.be.equal('Watts');
            expect(shippingAddress.city).to.be.equal('Brooklyn');
            expect(shippingAddress.stateCode).to.be.equal('NY');
            expect(shippingAddress.countryCode.value).to.be.equal('US');
            expect(shippingAddress.postalCode).to.be.equal('10044');
        });
        console.log('Shipping addresses are set properly to basket shipments according to bolt account');
    }

    beforeEach(function () {
        account = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/services/account', {
            'dw/order/BasketMgr': require('../../../../mocks/dw/order/BasketMgr'),
            'dw/order/ShippingMgr': require('../../../../mocks/dw/order/ShippingMgr'),
            'dw/system/Transaction': require('../../../../mocks/dw/system/Transaction'),
            '~/cartridge/scripts/util/boltLogUtils': require('../../../../mocks/bolt/boltLogUtils'),

            '*/cartridge/scripts/util/collections': collections,

            '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
            '~/cartridge/scripts/util/boltAccountUtils': require('../../../../mocks/bolt/boltAccountUtils.js')
        });
        shopperDetails = {
            addresses: [
                {
                    company: 'Bolt',
                    country: 'United States',
                    country_code: 'US',
                    email_address: 'alan.watts@bolt.com',
                    first_name: 'Alan',
                    id: 'string',
                    last_name: 'Watts',
                    locality: 'Brooklyn',
                    name: 'Alan Watts',
                    phone_number: '1-867-5309',
                    postal_code: '10044',
                    region: 'NY',
                    region_code: 'NY',
                    street_address1: '888 main street',
                    street_address2: 'apt 3021',
                    default: true
                }
            ],
            has_bolt_account: true,
            payment_methods: [
                {
                    billing_address: {
                        company: 'Bolt',
                        country: 'United States',
                        country_code: 'US',
                        email_address: 'alan.watts@bolt.com',
                        first_name: 'Alan',
                        id: 'string',
                        last_name: 'Watts',
                        locality: 'Brooklyn',
                        name: 'Alan Watts',
                        phone_number: '1-867-5309',
                        postal_code: '10044',
                        region: 'NY',
                        region_code: 'NY',
                        street_address1: '888 main street',
                        street_address2: 'apt 3021'
                    },
                    id: 'string',
                    last4: '4021',
                    type: 'card',
                    network: 'visa',
                    exp_month: '3',
                    exp_year: '2030',
                    default: true
                }
            ],
            profile: {
                email: 'alan.watts@bolt.com',
                first_name: 'Alan',
                last_name: 'Watts',
                name: 'Alan Watts',
                phone: '1-867-5309'
            }
        };
    });

    it('Account details are added to basket', function () {
        var currentBasket = BasketMgr.getCurrentBasket();

        // clear the current basket mock
        currentBasket.defaultShipment.shippingAddress = null;
        currentBasket.billingAddress = null;

        var res = account.addAccountDetailsToBasket(shopperDetails);

        // verify that no redirects are needed
        expect(res.redirectShipping).to.be.undefined;
        expect(res.redirectBilling).to.be.undefined;

        // verify the billing address is set properly according to account profile
        verifyBillingAddress(currentBasket);

        // verify the shipping address is set properly according to account profile
        verifyShipments(currentBasket);

        // verify the payment instrument is set properly according to account profile
        verifyPaymentInstruments(currentBasket);

        // test that the custom attributes are added to the basket
        expect(currentBasket.custom.boltPaymentMethods).to.not.be.null;
    });

    it('redirect to shipping step if the default shipping address is missing from bolt account', function () {
        shopperDetails.addresses = [];
        var res = account.addAccountDetailsToBasket(shopperDetails);
        var currentBasket = BasketMgr.getCurrentBasket();

        // verify that redirectShipping is true because of missing addresses
        expect(res.redirectShipping).to.be.equal(true);

        // test that the custom attributes are added to the basket
        expect(currentBasket.custom.boltPaymentMethods).to.not.be.null;

        // verify the billing address is still set properly according to account profile
        verifyBillingAddress(currentBasket);

        // verify the payment instrument is still set properly according to account profile
        verifyPaymentInstruments(currentBasket);
    });

    it('redirect to billing step if default payment method is missing from bolt account', function () {
        shopperDetails.payment_methods = [];
        var res = account.addAccountDetailsToBasket(shopperDetails);
        var currentBasket = BasketMgr.getCurrentBasket();

        // verify that redirectShipping is true because of missing addresses
        expect(res.redirectBilling).to.be.equal(true);

        // verify the shipping address is set properly according to account profile
        verifyShipments(currentBasket);
    });
});
