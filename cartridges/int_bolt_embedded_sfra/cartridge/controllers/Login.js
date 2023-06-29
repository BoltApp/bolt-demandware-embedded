'use strict';

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
    if (!Site.getCurrent().getCustomPreferenceValue('boltEnableSSO')) {
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
    var boltOrderId = boltParam.order_id;
    if (!boltParam.code.value || !boltParam.scope.value || !boltParam.state.value) {
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

    // if shopper login during checkout, set bolt order id to session cache.
    // update session id to Bolt later in Account-Show since session id changed after login
    if (boltOrderId.value) {
        req.session.privacyCache.set('boltOrderId', boltOrderId.value);
    }

    // optional: this is to support any customized post-login actions and redirect url override
    var data = {
        redirectUrl: URLUtils.url('Account-Show'),
        isRegistration: output.isRegistration,
        additionalData: output.additionalData,
        email: output.email
    };
    data = OAuthUtils.process(req, res, data);

    res.redirect(data.redirectUrl);
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

module.exports = server.exports();
