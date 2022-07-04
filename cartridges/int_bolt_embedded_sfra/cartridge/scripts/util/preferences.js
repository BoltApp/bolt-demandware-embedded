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
  var boltApiUrl = this.getBoltApiServiceURL();
  var boltCdnUrl = boltConnectURL();
  var boltApiKey = site.getCustomPreferenceValue('boltAPIKey') || '';
  return {
    boltEnable: Site.getCurrent().getCustomPreferenceValue('boltEnable'),
    boltMerchantDivisionID: Site.getCurrent().getCustomPreferenceValue('boltMerchantDivisionID') || '',
    boltApiUrl: boltApiUrl,
    boltCdnUrl: boltCdnUrl,
    boltMultiPublishableKey: boltMultiPublishableKey,
    boltApiKey: boltApiKey,
  };
};

/**
 * Return API URL
 * @returns {string} API URL to load connect from
 */
exports.getBoltApiServiceURL = function boltApiURL() {
  const boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironment').valueOf();
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
 * @returns {string} CDN URL to load connect from
 */
function boltConnectURL() {
  const boltEnv = Site.getCurrent().getCustomPreferenceValue('boltEnvironment').valueOf();
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
