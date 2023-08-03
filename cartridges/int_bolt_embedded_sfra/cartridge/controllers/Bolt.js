'use strict';

/* API Includes */
var server = require('server');
var HttpResult = require('dw/svc/Result');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Site = require('dw/system/Site');

// Script includes
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var httpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var oAuth = require('~/cartridge/scripts/services/oAuth');
var account = require('~/cartridge/scripts/services/account');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');

var log = LogUtils.getLogger('Bolt');

server.get('FetchOAuthToken', server.middleware.https, function (req, res, next) {
    var response = oAuth.fetchNewToken(req.querystring.code, req.querystring.scope);
    var returnObject = {};
    var isSSOEnabled = Site.getCurrent().getCustomPreferenceValue('boltEnableSSO');

    if (response.status === HttpResult.OK) {
        returnObject.accessToken = response.result.access_token;
        returnObject.refreshToken = response.result.refresh_token;
        session.privacy.boltOAuthToken = response.result.access_token;
        session.privacy.boltRefreshToken = response.result.refresh_token;
        session.privacy.boltRefreshTokenScope = response.result.refresh_token_scope;
        // store OAuth token expire time in milliseconds, 1000 -> ONE_SECOND
        session.privacy.boltOAuthTokenExpire = response.result.expires_in * 1000
            + new Date().getTime();

        // login platform account use the id token in response if sso enabled
        if (isSSOEnabled) {
            var currentBasket = BasketMgr.getCurrentOrNewBasket();
            Transaction.wrap(function () {
                currentBasket.custom.boltEmbeddedAccountsTokens = JSON.stringify(response.result);
            });
            account.loginOrCreatePlatformAccount(response.result.id_token);
        }

        account.removeFallbackLogoutCookie(res);
        log.info('fetching oauth token succeeded');
    } else {
        var errorMsg = 'Failed to fetch OAuth Token.' + !empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : '';
        log.error(errorMsg);
        returnObject.errorMessage = errorMsg;
    }

    res.json(returnObject);
    next();
});

server.get('GetAccountDetails', server.middleware.https, function (req, res, next) {
    var boltOAuthToken = oAuth.getOAuthToken();
    if (empty(boltOAuthToken)) {
        var errorMessage = 'Bolt OAuth Token is missing';
        log.error(errorMessage);
        res.json({
            success: false,
            errorMessage: errorMessage
        });
    }

    var bearerToken = 'Bearer '.concat(boltOAuthToken);
    var response = httpUtils.restAPIClient(constants.HTTP_METHOD_GET, constants.ACCOUNT_DETAILS_URL, null, '', bearerToken);

    var returnObject = {};
    if (response.status === HttpResult.OK) {
        var shopperDetails = response.result;
        var addAccountDetailsResult = account.addAccountDetailsToBasket(shopperDetails);
        if (addAccountDetailsResult.redirectShipping) {
            returnObject.redirectUrl = URLUtils.https('Checkout-Begin').append('stage', 'shipping').toString();
        } else if (addAccountDetailsResult.redirectBilling) {
            returnObject.redirectUrl = URLUtils.https('Checkout-Begin').append('stage', 'payment').toString();
        } else {
            returnObject.redirectUrl = URLUtils.https('Checkout-Begin').append('stage', 'placeOrder').toString();
        }
        returnObject.success = true;
    } else {
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

/**
 * Bolt-AccountLogOut : This endpoint is used to clear Bolt user information
 * in the SFCC basket and session
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('AccountLogOut', server.middleware.https, function (req, res, next) {
    try {
        boltAccountUtils.clearBoltSessionData();
        boltAccountUtils.clearShopperDataInBasket();
        account.setFallbackLogoutCookie(res);
        CustomerMgr.logoutCustomer(false);
        var redirectURL = URLUtils.https('Checkout-Begin').append('stage', 'shipping');
        res.json({
            success: true,
            redirectUrl: redirectURL.toString()
        });
        log.info('logout succeed');
    } catch (e) {
        log.error('Bolt Account Logout: ' + e.message + ' ' + e.stack);
        res.setStatusCode('500');
        res.json({
            status: 'error',
            message: Resource.msg('account.logout.error.general', 'bolt', null)
        });
    }
    next();
});

server.post('GetAccount', function (req, res, next) {
    if (!httpUtils.getAuthenticationStatus()) {
        return httpUtils.errorResponse('Request is not authenticated.', 401, res, next);
    }
    var httpParameterMap = request.getHttpParameterMap();
    var requestBodyString = httpParameterMap.get('requestBodyAsString') ? httpParameterMap.requestBodyAsString : null;
    var requestBody = JSON.parse(requestBodyString);
    var email = requestBody.email;
    if (!email) {
        return httpUtils.errorResponse('Missing email in the request body.', 400, res, next);
    }

    var customer = CustomerMgr.getCustomerByLogin(email);
    if (!customer) {
        return httpUtils.errorResponse('Customer not found with given email.', 404, res, next);
    }

    res.json({
        id: customer.ID
    });

    return next();
});

module.exports = server.exports();
