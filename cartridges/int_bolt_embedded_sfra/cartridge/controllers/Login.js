'use strict';

var BoltPreferences = require('~/cartridge/scripts/util/preferences');

var server = require('server');
var Login = module.superModule;
server.extend(Login);

/* API Includes */
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

/* Script Modules */
var OAuthUtils = require('~/cartridge/scripts/util/oauthUtils');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = LogUtils.getLogger('Login');

server.get('OAuthRedirectBolt', function (req, res, next) {
    var boltIgniteEnabled = Site.getCurrent().getCustomPreferenceValue('boltIgniteEnabled');
    var boltEnableSSO = Site.getCurrent().getCustomPreferenceValue('boltEnableSSO');

    if (!boltIgniteEnabled && !boltEnableSSO) {
        log.error('Bolt SSO feature is not enabled');
        return renderError(res, next);
    }

    /*
    boltParam contains:
    reference: SFCC basket ID
    display_id: SFCC order ID
    order_uuid: SFCC order UUID
    order_id: Bolt order ID
    */
    var boltParam = request.getHttpParameterMap();
    var orderToken = boltParam.order_uuid;
    if (!boltParam.code.value || !boltParam.scope.value) {
        log.error('Missing required parameter in request form: ' + LogUtils.maskCustomerData(req));
        return renderError(res, next);
    }

    var output = OAuthUtils.oauthLoginOrCreatePlatformAccount(boltParam.code, boltParam.scope, boltParam.display_id, orderToken);
    if (output.status === 'failure') {
        if (output.ignoreError) { // if ignore error, don't show error page.
            return next();
        }
        log.error(output.message);
        renderError(res, next);
    }

    // optional: this is to support any customized post-login actions and redirect url override
    var data = {
        redirectUrl: URLUtils.url('Account-Show').toString(),
        isRegistration: output.isRegistration,
        additionalData: output.additionalData,
        email: output.email
    };
    data = OAuthUtils.process(req, res, data);

    if (boltIgniteEnabled) {
        res.json(data);
    } else if (boltEnableSSO) {
        res.redirect(data.redirectUrl);
    }
    return next();
});

/**
 * Renders the error page.
 * @param {Object} res - the response object
 * @param {any} next - the next() function
 * @returns {any} result - will call next()
 */
function renderError(res, next) {
    res.render('/error', {
        message: Resource.msg('error.oauth.login.failure', 'login', null)
    });
    return next();
}

/**
 * Login-Show : This endpoint is called to load the login page
 * @name Base/Login-Show
 * @function
 * @memberof Login
 */
server.append(
    'Show',
    function (req, res, next) {
        var configuration = BoltPreferences.getSitePreferences();

        res.render('/account/login', { config: configuration });

        next();
    }
);

module.exports = server.exports();
