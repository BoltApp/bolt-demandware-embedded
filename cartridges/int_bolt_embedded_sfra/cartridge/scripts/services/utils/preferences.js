"use strict";

/* API Includes */
var Site = require('dw/system/Site');
/* Script Includes */

var LogUtils = require('~/cartridge/scripts/utils/boltLogUtils');
var log = LogUtils.getLogger('BoltPreferences');
/**
 * Get the custom preferences value from Business Manager, Bolt Payment Setting - Embedded
 * @returns {Object} custom preferences value object
 */

exports.getSitePreferences = function () {
  var site = Site.getCurrent(); 

  var boltMultiPublishableKey = site.getCustomPreferenceValue('boltMultiPublishableKey') || '';
  var boltApiUrl = boltApiURL();
  var boltCdnUrl = boltConnectURL();
  return {
    boltEnable: Site.getCurrent().getCustomPreferenceValue('boltEnable'),
    boltMerchantDivisionID: Site.getCurrent().getCustomPreferenceValue('boltMerchantDivisionID') || '',
    boltApiUrl: boltApiUrl,
    boltCdnUrl: boltCdnUrl,
    boltMultiPublishableKey: boltMultiPublishableKey,
  };
};

/**
 * Return API URL
 * @returns {string} API URL to check user account existence
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
};

/**
 * Return CDN URL
 * @returns {string} CDN URL to load embed.js
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