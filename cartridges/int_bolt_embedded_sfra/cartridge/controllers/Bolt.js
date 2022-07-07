"use strict";
/* API Includes */
var HttpResult = require('dw/svc/Result');
var server = require('server');
var URLUtils = require('dw/web/URLUtils');

// Script includes
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var httpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var oauth = require('~/cartridge/scripts/services/oauth');
var preferences = require('~/cartridge/scripts/util/preferences');
var account = require('~/cartridge/scripts/services/account');

var log = LogUtils.getLogger('CheckAccount');

server.get('AccountExists', server.middleware.https, function (req, res, next) {
    var email = req.querystring.email;
    var response = httpUtils.restAPIClient('GET', constants.CHECK_ACCOUNT_EXIST_URL + email);

    var returnObject = {};
    if(response.status === HttpResult.OK) {
        returnObject.hasBoltAccount = response.result.has_bolt_account;
        session.privacy.isAuthenticatedboltShopper = true;
    } else {
        returnObject.hasBoltAccount = false;
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

server.get('FetchOauthToken', server.middleware.https, function (req, res, next) {
    var config = preferences.getSitePreferences();
    var response = oauth.fetchToken(req.querystring.code, req.querystring.scope, config.boltMultiPublishableKey, config.boltApiKey)

    var returnObject = {};
    if(response.status === HttpResult.OK) {
        returnObject.accessToken = response.result.access_token;
        returnObject.refreshToken = response.result.refresh_token;
        session.privacy.boltOauthToken = response.result.access_token;
        session.privacy.boltRefreshToken = response.result.refresh_token;
    } else {
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

server.get('GetAccountDetails', server.middleware.https, function (req, res, next) {
    var bearerToken = "Bearer ".concat(req.querystring.bearerToken);
    var response = httpUtils.restAPIClient("GET", constants.ACCOUNT_DETAILS_URL, null, '', bearerToken)

    var returnObject = {};
    if(response.status === HttpResult.OK) {
        var shopperDetails = response.result;
        account.addAccountDetailsToBasket(shopperDetails);
        returnObject.success = true;
        returnObject.redirectUrl = URLUtils.https("Checkout-Begin") + "?stage=placeOrder#placeOrder";
    } else {
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

module.exports = server.exports();