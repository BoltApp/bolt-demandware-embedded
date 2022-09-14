'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var assert = require('chai').assert;
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('oAuth', function () {
    var oAuth = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/services/oAuth', {
        'dw/svc/Result': require('../../../../mocks/dw/svc/Result'),
        '~/cartridge/scripts/services/httpUtils': require('../../../../mocks/bolt/httpUtils'),
        '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/util/boltLogUtils': require('../../../../mocks/bolt/boltLogUtils'),
        '~/cartridge/scripts/util/preferences': require('../../../../mocks/bolt/preferences.js')
    });

    it('returns a new oauth token without errors', function () {
        var response = oAuth.fetchNewToken();

        expect(response.result.access_token).to.not.be.null;
        expect(response.result.refresh_token).to.not.be.null;
        expect(response.result.expires_in).to.not.be.null;
    });

});
