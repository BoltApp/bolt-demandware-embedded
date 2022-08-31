'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var assert = require('chai').assert;
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('preference', function () {
    var preference = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/preferences', {
        'dw/system/Site': require('../../../../mocks/dw/system/Site'),
        'dw/system/Logger': require('../../../../mocks/dw/system/Logger')
    });

    it('getSitePreferences returns all site preferences', function () {
        var response = preference.getSitePreferences();

        expect(response.boltEnable).to.not.be.null;
        expect(response.boltMerchantDivisionID).to.not.be.null;
        expect(response.boltApiUrl).to.not.be.null;
        expect(response.boltCdnUrl).to.not.be.null;
        expect(response.boltMultiPublishableKey).to.not.be.null;
    });

    it('getBoltAPIKey returns the api key', function () {
        var response = preference.getBoltAPIKey();
        expect(response).to.not.be.null;
    });

});
