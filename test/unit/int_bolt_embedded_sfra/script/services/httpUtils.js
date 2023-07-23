'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var HttpResult = require('../../../../mocks/dw/svc/Result');

var serviceReturnedObj = sinon.stub();

const INVALID_JSON_ERR_MSG = "<msg>error</msg>"

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
        var response = httpUtils.restAPIClient('GET', '/v1/account', null, '', 'Bearer test123456');

        expect(response.status).to.be.equal(HttpResult.OK);
        expect(response.errors.length).to.be.equal(0);
        expect(response.result.ok).to.be.equal(true);
    });

    it('returns error and status error for rest api call', function () {
        var response = httpUtils.restAPIClient('GET', '/v1/account_err1', null, '', 'Bearer test123456');

        const expectErr1 = 'Service execution failed with no error message';
        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors).to.be.equal(expectErr1);
        expect(response.result).to.be.null;
    });

    it('returns error and status error for service unavailable', function () {
        var response = httpUtils.restAPIClient('GET', '/v1/account_err2', null, '', 'Bearer test123456');

        const expectErrs2 = 'unavailable reason';
        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors[0].message).to.be.equal(expectErrs2);
        expect(response.result).to.be.null;
    });

    it('returns error and status error without error msg', function () {
        var response = httpUtils.restAPIClient('GET', '/v1/account_err3', null, '', 'Bearer test123456');

        const expectErrs3 = 'Service execution failed with no error message';
        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors[0].message).to.be.equal(expectErrs3);
        expect(response.result).to.be.null;
    });

});
