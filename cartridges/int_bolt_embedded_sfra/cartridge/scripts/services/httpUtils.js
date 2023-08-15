'use strict';

/* eslint-disable no-shadow */
/**
 * Utility functions for API service
 */
/* API Includes */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var HttpResult = require('dw/svc/Result');
var System = require('dw/system/System');
var Site = require('dw/system/Site');
var Mac = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');

/* Script Includes */
var constants = require('~/cartridge/scripts/util/constants');
var boltPreferences = require('~/cartridge/scripts/util/preferences');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('HttpUtils');

/**
 * Communicates with Bolt APIs
 * @param {string} method - web service method
 * @param {string} endPoint - Bolt API url
 * @param {Object} request - request object
 * @param {string} requestContentType - content type, ex: "application/x-www-form-urlencoded"
 * @param {string} authenticationHeader - bearer header for authentication
 * @param {string} fullUrlOverride - service endpoint
 * @returns {ServiceResponse} service response
 */
exports.restAPIClient = function (
    method,
    endPoint,
    request,
    requestContentType,
    authenticationHeader,
    fullUrlOverride
) {
    var isProductionEnv = System.getInstanceType() === System.PRODUCTION_SYSTEM;
    var service = LocalServiceRegistry.createService('bolt.http', {
        createRequest: function (service, args) {
            service.URL = args.endPointUrl;
            service.setRequestMethod(args.method);
            if (!empty(requestContentType)) {
                service.addHeader('Content-Type', requestContentType);
            }
            service.addHeader('X-Api-Key', args.boltAPIKey);
            service.addHeader('Content-Length', args.request.length);
            service.addHeader('X-Nonce', new Date().getTime());
            service.addHeader('X-Bolt-Source-Name', constants.BOLT_SOURCE_NAME);
            service.addHeader('X-Bolt-Source-Version', constants.BOLT_CARTRIDGE_VERSION);
            if (authenticationHeader) {
                service.addHeader('Authorization', authenticationHeader);
            }
            return args.request;
        },
        parseResponse: serviceParseResponse,
        getRequestLogMessage: function (request) {
            var emptyRequest = JSON.stringify({});
            try {
                if (isProductionEnv) {
                    if (requestContentType !== constants.CONTENT_TYPE_JSON) {
                        return request;
                    }
                    return request ? logUtils.maskCustomerData(JSON.parse(request)) : emptyRequest;
                }
                return request;
            } catch (e) {
                log.error(e.message);
                return isProductionEnv ? emptyRequest : request;
            }
        },
        getResponseLogMessage: function (response) {
            var emptyResponse = JSON.stringify({});
            try {
                if (isProductionEnv) {
                    return logUtils.maskCustomerData(JSON.parse(response.text));
                }
                return response.text;
            } catch (e) {
                log.error(e.message);
                return isProductionEnv ? emptyResponse : response.text;
            }
        }
    });

    var boltAPIKey = boltPreferences.getBoltAPIKey();
    var baseAPIUrl = boltPreferences.getSitePreferences().boltApiUrl;
    var endPointUrl = baseAPIUrl + endPoint;
    request = request || '';
    var serviceArgs = {
        method: method,
        endPointUrl: fullUrlOverride || endPointUrl,
        request: request,
        boltAPIKey: boltAPIKey
    };
    var result = service.call(serviceArgs);

    if (result && result.status === HttpResult.OK) {
        return {
            status: HttpResult.OK,
            errors: [],
            result: result.object
        };
    }

    log.error('Error on Service execution: ' + result);

    if (result && result.status === HttpResult.SERVICE_UNAVAILABLE) {
        return {
            status: HttpResult.ERROR,
            errors: [new Error(result.unavailableReason)],
            result: null
        };
    }

    if (result.errorMessage) {
        try {
            var responseError = JSON.parse(result.errorMessage);
            return {
                status: HttpResult.ERROR,
                errors: responseError.errors || [
                    new Error('Service execution failed with no error message')
                ],
                result: null
            };
        } catch (e) {
            return {
                status: HttpResult.ERROR,
                errors: [
                    new Error('Failed to parse error messages from service response')
                ],
                result: null
            };
        }
    } else {
        return {
            status: HttpResult.ERROR,
            errors: [new Error('Service execution failed with no error message')],
            result: null
        };
    }
};

/**
 * HTTPService configuration parseResponse
 * @param {Object} _service - HTTP service
 * @param {Object} httpClient - HTTP client
 * @returns {string | null} success or null
 */
function serviceParseResponse(_service, httpClient) {
    var res;

    if (httpClient.statusCode === 200 || httpClient.statusCode === 201) {
        res = JSON.parse(httpClient.getText());
    } else {
        log.error('Error on http request:' + httpClient.getErrorText());
    }

    return res;
}

/**
 * Check authentication status
 * @returns {boolean} authentication status
 */
exports.getAuthenticationStatus = function () {
    var strAuth = request.getHttpHeaders().get('x-bolt-hmac-sha256');
    if (!strAuth) {
        log.error('Missing authorization key on request header');
        return false;
    }

    var boltSigningSecret = Site.getCurrent().getCustomPreferenceValue('boltSigningSecret') || '';
    if (!boltSigningSecret) {
        log.error("Missing BM custom preference value for 'Signing Secret'");
        return false;
    }

    var httpParameterMap = request.getHttpParameterMap();
    var requestBody = httpParameterMap.get('requestBodyAsString') ? httpParameterMap.requestBodyAsString : null;
    var mac = new Mac(Mac.HMAC_SHA_256);
    var sha = mac.digest(requestBody, boltSigningSecret);
    var hmac = Encoding.toBase64(sha);
    return hmac === strAuth;
};

/**
 * This set the error msg and error code to res and return next().
 * @param {Object} msg - the error message
 * @param {Object} statusCode - the status code
 * @param {Object} res - the response object
 * @param {any} next - the next() function
 * @returns {any} result - will call next()
 */
exports.errorResponse = function (msg, statusCode, res, next) {
    log.error(msg);
    res.json({
        error: msg
    });
    res.setStatusCode(statusCode);
    return next();
};
