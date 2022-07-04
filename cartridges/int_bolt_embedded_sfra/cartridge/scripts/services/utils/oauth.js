var httpUtils = require('~/cartridge/scripts/services/httpUtils')
var constants = require('~/cartridge/scripts/util/constants');
/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {string} code - the authorization code received
 * @param {string} scope - scope for the oauth workflow, currently only support openid
 * @param {string} clientId - client id for the oauth workflow, should be the same as merchant publishable key
 * @param {string} clientSecret - client secret for the oauth workflow, should be the same as merchant API key
 * @param {string} tokenEndpoint - token endpoint for oauth flow
 * @returns {Object} result
 */
 exports.exchangeToken = function(code, scope, clientId, clientSecret) {
     var payload = "grant_type=authorization_code&code="
         .concat(code, "&scope=")
         .concat(scope, "&client_secret=")
         .concat(clientSecret, "&client_id=")
         .concat(clientId);
     return httpUtils.restAPIClient('POST', constants.OAUTH_TOKEN, payload, 'application/x-www-form-urlencoded');
  }
  