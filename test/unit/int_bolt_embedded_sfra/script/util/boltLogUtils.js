'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Log util functions', function () {
    var boltLogUtils = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/boltLogUtils', {
        'dw/system/Logger': require('../../../../mocks/dw/system/Logger'),
    });
    var request, response;
    
    beforeEach(function () {
        request = {
            first_name: 'Bob',
            last_name: 'Smith',
            name: 'Bob Smith',
            phone: '8888888888',
            expiration: '1898553600000',
            billing_address: 'test billing address',
            shipping_address: 'test shipping address',
            email: 'test@bolt.com',
            locality: 'new york',
            region: 'NY',
            postal_code: '10001',
            country_code: 'US'
        };

        response = {
            first_name: '***',
            last_name: '***',
            name: '***',
            phone: '***',
            expiration: '***',
            billing_address: '***',
            shipping_address: '***',
            email: '***',
            locality: 'new york',
            region: 'NY',
            postal_code: '10001',
            country_code: 'US'
        }
    });

    it('returns Bolt logger without errors', function () {
        var response = boltLogUtils.getLogger('testcategory');
        expect(response).to.not.be.null;
    });

    it('mask customer data without errors', function () {
        var expectedResponse = JSON.stringify(response);
        var maskedData = boltLogUtils.maskCustomerData(request);

        expect(maskedData).to.not.be.null;
        expect(maskedData).to.be.equal(expectedResponse);
    });

    it('mask nested customer data without errors', function () {
        request.address = {
            billing_address: 'test billing address'
        }

        response.address = {
            billing_address: '***'
        }

        var expectedResponse = JSON.stringify(response);
        var maskedData = boltLogUtils.maskCustomerData(request);

        expect(maskedData).to.not.be.null;
        expect(maskedData).to.be.equal(expectedResponse);
    });
});
