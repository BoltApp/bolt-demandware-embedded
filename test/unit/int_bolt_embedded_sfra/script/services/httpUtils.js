'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var assert = require('chai').assert;
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var HttpResult = require('../../../../mocks/dw/svc/Result');

describe('httpUtils happy path', function () {
    var httpUtils = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/services/httpUtils', {
        'dw/svc/LocalServiceRegistry': require('../../../../mocks/dw/svc/LocalServiceRegistry'),
        'dw/svc/Result': require('../../../../mocks/dw/svc/Result'),
        'dw/system/System': require('../../../../mocks/dw/system/System'),
        '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/util/boltLogUtils': require('../../../../mocks/bolt/boltLogUtils'),
        '~/cartridge/scripts/util/preferences': require('../../../../mocks/bolt/preferences.js')
    });

    it('returns no error and status ok for rest api call', function () {
        var response = httpUtils.restAPIClient();

        expect(response.status).to.be.equal(HttpResult.OK);
        expect(response.errors.length).to.be.equal(0);
        expect(response.result).to.not.be.null;
    });

});

describe('httpUtil error case', function(){
    var httpUtils = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/services/httpUtils', {
        'dw/svc/LocalServiceRegistry': {
            createService: function () {
                return {
                    call: function () {
                        return {
                            status: HttpResult.ERROR
                        };
                    }
                };
            }
        },
        'dw/svc/Result': require('../../../../mocks/dw/svc/Result'),
        'dw/system/System': require('../../../../mocks/dw/system/System'),
        '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/util/boltLogUtils': require('../../../../mocks/bolt/boltLogUtils'),
        '~/cartridge/scripts/util/preferences': require('../../../../mocks/bolt/preferences.js')
    });

    it('returns error and status error for rest api call', function () {
        var response = httpUtils.restAPIClient();

        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors.length).to.be.greaterThan(0);
        expect(response.result).to.be.null;
    });

});