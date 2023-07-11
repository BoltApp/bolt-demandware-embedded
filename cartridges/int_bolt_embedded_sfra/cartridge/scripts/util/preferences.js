'use strict';

/* API Includes */
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('BoltPreferences');

/**
 * Get the custom preferences value from Business Manager, Bolt Payment Setting - Embedded
 * @returns {Object} custom preferences value object
 */

exports.getSitePreferences = function () {
    var site = Site.getCurrent();

    var boltMultiPublishableKey = site.getCustomPreferenceValue('boltMultiPublishableKey') || '';
    var boltApiUrl = boltApiURL();
    var boltCdnUrl = boltConnectURL();
    var boltEnable = Site.getCurrent().getCustomPreferenceValue('boltEnable');
    var boltEnableSSO = Site.getCurrent().getCustomPreferenceValue('boltEnableSSO');
    var boltMerchantDivisionID = Site.getCurrent().getCustomPreferenceValue('boltMerchantDivisionID') || '';

    if (!boltEnable) {
        log.warn("Bolt is disabled! Please set 'boltEnable' to true in custom preference");
    }

    if (!boltMerchantDivisionID || !boltMultiPublishableKey) {
        log.error('Error: Bolt Business Manager configurations (boltMerchantDivisionID, boltMultiPublishableKey) are missing.');
    }

    return {
        boltEnable: boltEnable,
        boltMerchantDivisionID: boltMerchantDivisionID,
        boltApiUrl: boltApiUrl,
        boltCdnUrl: boltCdnUrl,
        boltMultiPublishableKey: boltMultiPublishableKey,
        boltEnableSSO: boltEnableSSO,
        boltAccountURL: boltAccountURL()
    };
};

/**
 * Get the bolt api key settings from Business Manager
 * @returns {Object} configuration object
 */
exports.getBoltAPIKey = function () {
    var site = Site.getCurrent();
    var boltAPIKey = site.getCustomPreferenceValue('boltAPIKey') || '';

    if (boltAPIKey === '') {
        log.error('Error: Bolt Business Manager configurations boltAPIKey is missing.');
    }

    return boltAPIKey;
};

/**
 * Return API URL
 * @returns {string} API URL to load connect from
 */
function boltApiURL() {
    var boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironment').valueOf();
    switch (boltEnv) {
        case 'local':
            return 'https://api.serena-external.dev.bolt.me';
        case 'sandbox':
            return 'https://api-sandbox.bolt.com';
        case 'staging':
            return 'https://api-staging.bolt.com';
        case 'production':
        default:
            return 'https://api.bolt.com';
    }
}

/**
 * Return CDN URL
 * @returns {string} CDN URL to load connect from
 */
function boltConnectURL() {
    var boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironment').valueOf();
    switch (boltEnv) {
        case 'local':
            return 'https://connect.serena.dev.bolt.me';
        case 'sandbox':
            return 'https://connect-sandbox.bolt.com';
        case 'staging':
            return 'https://connect-staging.bolt.com';
        case 'production':
        default:
            return 'https://connect.bolt.com';
    }
}

/**
 * Return Account URL
 * @returns {string} Account URL to access Bolt account related feature (SSO)
 */
function boltAccountURL() {
    var boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironment').valueOf();
    switch (boltEnv) {
        case 'local':
            return 'https://account.serena.dev.bolt.me';
        case 'sandbox':
            return 'https://account-sandbox.bolt.com';
        case 'staging':
            return 'https://account-staging.bolt.com';
        case 'production':
        default:
            return 'https://account.bolt.com';
    }
}
