'use strict';

/* API Includes */
var HttpResult = require('dw/svc/Result');

/* Script Includes */
var httpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var preferences = require('~/cartridge/scripts/util/preferences');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = LogUtils.getLogger('OAuth');

/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {string} code - the authorization code received
 * @param {string} scope - scope for the OAuth workflow, currently only support openid
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
    return httpUtils.restAPIClient(constants.HTTP_METHOD_POST, constants.OAUTH_TOKEN_URL, payload, constants.CONTENT_TYPE_URL_ENCODED);
};

/**
 * Check if log in OAuth token is still valid, refresh the token if it expires.
 * @returns {string} boltOAuthToken - New OAuth token
 */
exports.getOAuthToken = function () {
    // OAuth token will not expire in 4 seconds, use the current OAuth token in session
    if ((session.custom.boltOAuthTokenExpire - new Date().getTime()) > constants.OAUTH_TOKEN_REFRESH_TIME) { // eslint-disable-line no-undef
        return session.custom.boltOAuthToken; // eslint-disable-line no-undef
    }

    // refresh OAuth token
    return refreshToken();
};

/**
 * Refresh the expired oauth token.
 * @returns {string} boltOauthToken - Refreshed Oauth token
 */
function refreshToken() {
    var boltOAuthToken;
    if (!session.custom.boltRefreshToken || !session.custom.boltRefreshTokenScope) { // eslint-disable-line no-undef
        log.error('Refresh token or refresh token scope is missing.');
        return boltOAuthToken;
    }

    var config = preferences.getSitePreferences();
    var payload = 'grant_type=refresh_token&refresh_token='
        .concat(session.custom.boltRefreshToken, '&scope=') // eslint-disable-line no-undef
        .concat(session.custom.boltRefreshTokenScope, '&client_secret=') // eslint-disable-line no-undef
        .concat(config.boltApiKey, '&client_id=')
        .concat(config.boltMultiPublishableKey);

    var response = httpUtils.restAPIClient('POST', constants.OAUTH_TOKEN_URL, payload, 'application/x-www-form-urlencoded');
    if (response.status === HttpResult.OK && !empty(response.result)) { // eslint-disable-line no-undef
        session.custom.boltOAuthToken = response.result.access_token; // eslint-disable-line no-undef
        session.custom.boltRefreshToken = response.result.refresh_token; // eslint-disable-line no-undef
        session.custom.boltRefreshTokenScope = response.result.refresh_token_scope; // eslint-disable-line no-undef
        // store OAuth token expire time in milliseconds, 1000 -> ONE_SECOND
        session.custom.boltOAuthTokenExpire = Date.now() + response.result.expires_in * 1000; // eslint-disable-line no-undef
        boltOAuthToken = response.result.access_token;
    } else {
        log.error('Failed to refresh OAuth Token.' + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : '')); // eslint-disable-line no-undef
    }

    return boltOAuthToken;
}
