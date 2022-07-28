'use strict';

/* API Includes */
var HttpResult = require('dw/svc/Result');

/* Script Includes */
var httpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var preferences = require('~/cartridge/scripts/util/preferences');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = LogUtils.getLogger('Oauth');

/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {string} code - the authorization code received
 * @param {string} scope - scope for the oauth workflow, currently only support openid
 * @returns {Object} result
 */
exports.fetchNewToken = function (code, scope) {
    var boltAPIKey = preferences.getBoltAPIKey();
    var config = preferences.getSitePreferences();
    var payload = 'grant_type=authorization_code&code='
        .concat(code, '&scope=')
        .concat(scope, '&client_secret=')
        .concat(boltAPIKey, '&client_id=')
        .concat(config.boltMultiPublishableKey);
    return httpUtils.restAPIClient('POST', constants.OAUTH_TOKEN_URL, payload, 'application/x-www-form-urlencoded');
};

/**
 * Check if log in Oauth token is still valid, refresh the token if it expires.
 * @returns {string} boltOauthToken - New Oauth token
 */
exports.getOauthToken = function () {
    // Oauth token will not expire in 4 seconds, use the current Oauth token in session
    if ((session.custom.boltOauthTokenExpire - new Date().getTime()) > constants.OAUTH_TOKEN_REFRESH_TIME) {
        return session.custom.boltOauthToken;
    }

    // refresh OAuth token
    return refreshToken();
};

function refreshToken() {
    var boltOauthToken;
    if (!session.custom.boltRefreshToken || !session.custom.boltRefreshTokenScope) {
        log.error('Refresh token or refresh token scope is missing.');
        return boltOauthToken;
    }

    var config = preferences.getSitePreferences();
    var payload = 'grant_type=refresh_token&refresh_token='
        .concat(session.custom.boltRefreshToken, '&scope=')
        .concat(session.custom.boltRefreshTokenScope, '&client_secret=')
        .concat(config.boltApiKey, '&client_id=')
        .concat(config.boltMultiPublishableKey);

    var response = httpUtils.restAPIClient('POST', constants.OAUTH_TOKEN_URL, payload, 'application/x-www-form-urlencoded');
    if (response.status === HttpResult.OK && !empty(response.result)) {
        session.custom.boltOauthToken = response.result.access_token;
        session.custom.boltRefreshToken = response.result.refresh_token;
        session.custom.boltRefreshTokenScope = response.result.refresh_token_scope;
        // store OAuth token expire time in milliseconds, 1000 -> ONE_SECOND
        session.custom.boltOauthTokenExpire = Date.now() + response.result.expires_in * 1000;
        boltOauthToken = response.result.access_token;
    } else {
        log.error('Failed to refresh Oauth Token.' + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : ''));
    }

    return boltOauthToken;
}
