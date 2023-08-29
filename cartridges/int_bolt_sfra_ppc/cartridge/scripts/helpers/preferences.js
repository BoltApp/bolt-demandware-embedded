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

    if (!boltEnable) {
        log.warn("Bolt is disabled! Please set 'boltEnable' to true in custom preference");
    }

    if (!boltMultiPublishableKey) {
        log.error('Error: Bolt Business Manager configurations (boltMultiPublishableKey) are missing.');
    }

    return {
        boltEnable: boltEnable,
        boltApiUrl: boltApiUrl,
        boltCdnUrl: boltCdnUrl,
        boltMultiPublishableKey: boltMultiPublishableKey,
        sfccBaseVersion: getSFCCBaseVersion(),
        boltEnablePPC: Site.getCurrent().getCustomPreferenceValue('boltEnablePPC') || false

    };
};

/**
 * Return API URL
 * @returns {string} API URL to load connect from
 */
function boltApiURL() {
    var boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironment').valueOf();
    switch (boltEnv) {
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
 * Returns the first digit configured in SFCC base version. "6.1.2" returns 6
 * @returns {number} the first number
 */
function getSFCCBaseVersion() {
    var version = 5;
    var sfccBaseVersion = Site.getCurrent().getCustomPreferenceValue('sfccBaseVersion');
    if (empty(sfccBaseVersion)) {
        return version;
    }

    var baseVersion = sfccBaseVersion.split('.');
    if (!empty(baseVersion)) {
        version = parseInt(baseVersion[0], 10);
    }

    return version;
}
