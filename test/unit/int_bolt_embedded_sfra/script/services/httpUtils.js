'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var HttpResult = require('../../../../mocks/dw/svc/Result');

var serviceReturnedObj = sinon.stub();
const result = {
    key: 'value'
};

const ERR_MSG = "error";
const INVALID_JSON_ERR_MSG = "<msg>error</msg>"

describe('httpUtils happy path', function () {
    var httpUtils = proxyquire('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/services/httpUtils', {
        'dw/svc/LocalServiceRegistry': {
            createService: function() {
                return {
                    call: serviceReturnedObj
                }
            }
        },
        'dw/svc/Result': require('../../../../mocks/dw/svc/Result'),
        'dw/system/System': require('../../../../mocks/dw/system/System'),
        '~/cartridge/scripts/util/constants': require('../../../../../cartridges/int_bolt_embedded_sfra/cartridge/scripts/util/constants'),
        '~/cartridge/scripts/util/boltLogUtils': require('../../../../mocks/bolt/boltLogUtils'),
        '~/cartridge/scripts/util/preferences': require('../../../../mocks/bolt/preferences.js')
    });

    it('returns no error and status ok for rest api call', function () {
        serviceReturnedObj.returns({
            status: HttpResult.OK,
            object: result
        });
        var response = httpUtils.restAPIClient();

        expect(response.status).to.be.equal(HttpResult.OK);
        expect(response.errors.length).to.be.equal(0);
        expect(response.result).to.be.equal(result);
    });

    it('returns error and status error for rest api call', function () {
        serviceReturnedObj.returns({
            status: HttpResult.ERROR,
            errorMessage: ERR_MSG
        });
        var response = httpUtils.restAPIClient();

        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors.length).to.be.greaterThan(0);
        expect(response.result).to.be.null;
    });

    it('returns error and status error for invalid error msg', function () {
        serviceReturnedObj.returns({
            status: HttpResult.ERROR,
            errorMessage: INVALID_JSON_ERR_MSG
        });
        var response = httpUtils.restAPIClient();

        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors.length).to.be.greaterThan(0);
        expect(response.result).to.be.null;
    });

    it('returns error and status error without error msg', function () {
        serviceReturnedObj.returns({
            status: HttpResult.ERROR,
        });
        var response = httpUtils.restAPIClient();

        expect(response.status).to.be.equal(HttpResult.ERROR);
        expect(response.errors.length).to.be.greaterThan(0);
        expect(response.result).to.be.null;
    });

});
