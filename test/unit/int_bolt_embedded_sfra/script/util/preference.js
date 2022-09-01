'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var assert = require('chai').assert;
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var site = require('../../../../mocks/dw/system/Site');

describe('preference', function () {
    var preference = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/preferences', {
        'dw/system/Site': require('../../../../mocks/dw/system/Site'),
        'dw/system/Logger': require('../../../../mocks/dw/system/Logger')
    });

    it('getSitePreferences returns all site preferences', function () {
        var response = preference.getSitePreferences();

        expect(response.boltEnable).to.be.equal(site.boltEnable);
        expect(response.boltMerchantDivisionID).to.be.equal(site.boltMerchantDivisionID);
        expect(response.boltApiUrl).to.be.equal(site.boltApiURL);
        expect(response.boltCdnUrl).to.be.equal(site.boltConnectURL);
        expect(response.boltMultiPublishableKey).to.be.equal(site.boltMultiPublishableKey);
    });

    it('getBoltAPIKey returns the api key', function () {
        var response = preference.getBoltAPIKey();
        expect(response).to.not.be.null;
    });
});
