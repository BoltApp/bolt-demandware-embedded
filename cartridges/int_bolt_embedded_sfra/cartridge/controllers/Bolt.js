"use strict";

var HttpResult = require('dw/svc/Result');
var server = require('server');
/* API Includes */

var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = LogUtils.getLogger('CheckAccount');
var httpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var oauth = require('~/cartridge/scripts/services/oauth');
var preferences = require('~/cartridge/scripts/util/preferences');
var account = require('~/cartridge/scripts/services/account');

server.get('accountExists', server.middleware.https, function (req, res, next) {
    var email = req.querystring.email;
    var response = httpUtils.restAPIClient('GET', constants.CHECK_ACCOUNT_EXIST_URL + email);

    var returnObject = {};
    if(response.status === HttpResult.OK) {
        returnObject.hasBoltAccount = response.result.has_bolt_account;
    } else {
        returnObject.hasBoltAccount = false;
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

server.get('fetchOauthToken', server.middleware.https, function (req, res, next) {
    var config = preferences.getSitePreferences();
    var response = oauth.fetchToken(req.querystring.code, req.querystring.scope, config.boltMultiPublishableKey, config.boltApiKey)

    var returnObject = {};
    if(response.status === HttpResult.OK) {
        returnObject.accessToken = response.result.access_token;
        returnObject.refreshToken = response.result.refresh_token;
    } else {
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

server.get('getAccountDetails', server.middleware.https, function (req, res, next) {
    var bearerToken = "Bearer ".concat(req.querystring.bearerToken);
    var response = httpUtils.restAPIClient("GET", constants.ACCOUNT_DETAILS_URL, null, '', bearerToken)

    var returnObject = {};
    if(response.status === HttpResult.OK) {
        var shopperDetails = response.result;
        account.addAccountDetailsToBasket(shopperDetails);
        returnObject = shopperDetails;
    } else {
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

server.get('basket', server.middleware.https, function (req, res, next) {
    res.json(require('dw/order/BasketMgr').getCurrentBasket());
    next();
});

module.exports = server.exports();