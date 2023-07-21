'use strict';

/* API Includes */
var CustomerMgr = require('dw/customer/CustomerMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var HttpResult = require('dw/svc/Result');
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var JWTUtils = require('~/cartridge/scripts/util/jwtUtils');
var BoltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var Constants = require('~/cartridge/scripts/util/constants');
var log = LogUtils.getLogger('Login');

var BoltProviderID = 'Bolt';

/**
 * Login the shopper using Bolt SSO
 * @param {string} code - the authorization code from Bolt
 * @param {string} scope - scope for the oauth workflow, currently only support openid
 * @param {string} orderId - the created order id if provided
 * @param {string} orderToken - the created order UUID if provided
 * @returns {Object} result
 */
exports.oauthLoginOrCreatePlatformAccount = function (code, scope, orderId, orderToken) {
    // step 1: fetch openID configuration from Bolt
    var oauthConfiguration = getOAuthConfiguration();
    var clientID = oauthConfiguration.clientID;
    var clientSecret = oauthConfiguration.clientSecret;
    var providerID = oauthConfiguration.providerID;
    var boltAPIbaseURL = oauthConfiguration.boltAPIbaseURL;
    var OpenIdEndpoint = Constants.OPENID_URL;
    var openIDConfigResponse = BoltHttpUtils.restAPIClient('GET', '', '', 'none', '', boltAPIbaseURL + OpenIdEndpoint);
    if (!openIDConfigResponse || openIDConfigResponse.status == HttpResult.ERROR || !openIDConfigResponse.result) {
        return oauthErrorResponse('Failed fetching open id configuration from endpoint: ' + OpenIdEndpoint);
    }
    var openIDConfig = openIDConfigResponse.result;

    // step 2: get OAuth token
    var oauthTokenResponse = exchangeOauthToken(code, scope, clientID, clientSecret, openIDConfig);
    if (oauthTokenResponse.error) {
        return oauthTokenResponse.error;
    }
    oauthTokenResponse = oauthTokenResponse.oauthToken;

    // step 3: validate JWT
    var idToken = oauthTokenResponse.id_token;
    var externalProfile = JWTUtils.parseAndValidateJWT(idToken, clientID, openIDConfig.jwks_uri);
    if (!externalProfile) {
        return oauthErrorResponse('Unable to parse external profile from id token: ' + idToken);
    }

    // step 4: create a new account or link existing account
    var createAccountResponse = createPlatformAccount(externalProfile, orderId, orderToken);
    if (createAccountResponse.error) {
        return customerProfile.error;
    }
    var customerProfile = createAccountResponse.profile;

    // step 5: login
    var platformAccountID = externalProfile.sub;
    var credentials = customerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(providerID, platformAccountID, false);
        });
    } else {
        return oauthErrorResponse('Platform account customer profile credentials disabled: ' + platformAccountID);
    }

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    // store OAuth token expire time in milliseconds, 1000 -> ONE_SECOND
    oauthTokenResponse.bolt_token_expires_in = oauthTokenResponse.expires_in * 1000 + new Date().getTime();
    Transaction.wrap(function () {
        currentBasket.custom.boltEmbeddedAccountsTokens = JSON.stringify(oauthTokenResponse);
    });

    return {
        status: 'success',
        platformAccountID: platformAccountID,
        isRegistration: createAccountResponse.isRegistration,
        additionalData: externalProfile.custom_fields,
        email: externalProfile.email
    };
};

/**
 * Return OAuth configuration
 * @returns {Object} result
 */
function getOAuthConfiguration() {
    var boltMultiPublishableKey = Site.getCurrent().getCustomPreferenceValue('boltMultiPublishableKey') || '';
    var publishableKeySplit = boltMultiPublishableKey.split('.');
    var clientID = publishableKeySplit[publishableKeySplit.length - 1];
    var prefs = BoltPreferences.getSitePreferences();

    var config = {
        clientID: clientID,
        clientSecret: Site.getCurrent().getCustomPreferenceValue('boltAPIKey') || '',
        providerID: BoltProviderID,
        boltAPIbaseURL: prefs.boltApiUrl
    };
    return config;
}

/**
 * Exchange for OAuth token, return the JSON encoded result of token exchange endpoint returned value
 * https://help.bolt.com/api-bolt/#tag/OAuth/operation/OAuthToken
 * @param {string} code - the authorization code received
 * @param {string} scope - scope for the oauth workflow, currently only support openid
 * @param {string} clientID - client id for the oauth workflow, should be the same as merchant publishable key
 * @param {string} clientSecret - client secret for the oauth workflow, should be the same as merchant API key
 * @param {string} openIDConfig - OpenId configuration
 * @returns {Object} result
 */
function exchangeOauthToken(code, scope, clientID, clientSecret, openIDConfig) {
    var oauthTokenEndpoint = openIDConfig.token_endpoint;
    var params = {
        grant_type: 'authorization_code',
        code: code,
        scope: scope,
        client_secret: clientSecret,
        client_id: clientID
    };
    var oauthTokenBody = [];
    Object.keys(params).forEach(function (key) {
        oauthTokenBody.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    });
    var oauthTokenPayload = oauthTokenBody.join('&');

    var serviceResponse = BoltHttpUtils.restAPIClient('POST', '', oauthTokenPayload, 'application/x-www-form-urlencoded', '', oauthTokenEndpoint);
    if (!serviceResponse || serviceResponse.status == HttpResult.ERROR || !serviceResponse.result) {
        return {
            error: oauthErrorResponse('Failed to exchange OAuth token from endpoint: ' + oauthTokenEndpoint)
        };
    }

    return {
        oauthToken: serviceResponse.result
    };
}

/**
 * Create a new external authenticated account if no existing account
 * For shoppers already have an account, create a new external Bolt profile
 * @param {Object} externalProfile - user info sent in the JWT token
 * @param {string} orderId - SFCC order ID
 * @param {string} orderToken - SFCC order token
 * @returns {Object} result
 */
function createPlatformAccount(externalProfile, orderId, orderToken) {
    var platformAccountID = externalProfile.sub;
    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(BoltProviderID, platformAccountID);
    var isRegistration = false; // isRegistration is true if the shopper does not have platform account associated with the email.

    if (!authenticatedCustomerProfile) { // user with the given email does not have a Bolt linked platform account
        var customer = CustomerMgr.getCustomerByLogin(externalProfile.email);
        if (!customer) { // create a new account if platform account with given email does not exist
            Transaction.wrap(function () {
                var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(BoltProviderID, platformAccountID);
                authenticatedCustomerProfile = newCustomer.getProfile();
                authenticatedCustomerProfile.setEmail(externalProfile.email);
                authenticatedCustomerProfile.setFirstName(externalProfile.first_name);
                authenticatedCustomerProfile.setLastName(externalProfile.last_name);

                // Optional: set order to the new created account if shopper creates account during checkout
                if (orderId.value && orderToken.value) {
                    var order = OrderMgr.getOrder(orderId.value, orderToken.value);
                    if (order && order.getCustomerEmail() === externalProfile.email) {
                        order.setCustomer(newCustomer);
                    }
                }
            });
            isRegistration = true;
        } else if (externalProfile.email_verified) {
            // link platform account with Bolt account if an account with given email exist, and the email is verified,
            Transaction.wrap(function () {
                customer.createExternalProfile(BoltProviderID, platformAccountID);
                authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(BoltProviderID, platformAccountID);
            });
        } else {
            // ignore the platform account, fail platform login silently if account with given email exist but the email is unverified
            return {
                error: oauthErrorResponse('Email is unverified for platform account id: ' + platformAccountID, true)
            };
        }
    }

    return {
        profile: authenticatedCustomerProfile,
        isRegistration: isRegistration
    };
}

/**
 * @param {string} message error message
 * @param {boolean} ignoreError indicate if oauth login should be failed silently without displaying the error
 * @return {Object} result
 */
function oauthErrorResponse(message, ignoreError) {
    return {
        status: 'failure',
        message: message,
        ignoreError: ignoreError
    };
}

// Support post login customizations
exports.process = function (req, res, data) {
    return data;
};

exports.getOAuthConfiguration = getOAuthConfiguration;
exports.createPlatformAccount = createPlatformAccount;
