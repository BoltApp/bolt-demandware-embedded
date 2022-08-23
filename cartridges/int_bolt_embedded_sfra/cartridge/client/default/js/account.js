'use strict';

var util = require('./util.js');

/**
 * Authorize With Email. This function creates the Bolt component from embed.js, mount it on the page
 * and renders the OTP modal to do authentication & authorization with Bolt
 * @param {string} customerEmail - input email
 * @returns {Promise} - the returned promise waits for the user to enter the 6 digis OTP code
 */
async function authorizeWithEmail(customerEmail) {
    const boltPublishableKey = $('.bolt-publishable-key').val();
    const locale = $('.bolt-locale').val();

    const boltEmbedded = Bolt(boltPublishableKey, { language: util.getISOCodeByLocale(locale) }); // eslint-disable-line no-undef

    const authorizationComponent = boltEmbedded.create('authorization_component', { style: { position: 'right' } });
    const containerToMount = $('#email-guest').parent().get(0); // there is only 1 occurance of $('#email-guest')
    containerToMount.classList.add('containerToMount');
    await authorizationComponent.mount('.containerToMount'); // mount on the div container otherwise the iframe won't render

    return authorizationComponent.authorize({ email: customerEmail });
}

/**
 * Log the user into their bolt account
 * @param {string} email - input email
 * @returns {Promise} The returned promise to fetch account details
 */
async function login(email) {
    const authorizeWithEmailResp = await authorizeWithEmail(email);
    if (!authorizeWithEmailResp) return;
    const OAuthResp = await authenticateUserWithCode(authorizeWithEmailResp.authorizationCode, authorizeWithEmailResp.scope);
    return getAccountDetails(OAuthResp.accessToken); // eslint-disable-line consistent-return
}

/**
 * This function uses the authCode and scope returned from authorizeWithEmail after the user enters the 6 digits OTP code
 * It makes a call to Bolt-FetchOAuthToken controller to fetch Oauth token & refresh token
 * @param {string} authCode - auth Code
 * @param {string} scope - scope, both params are returned from authorizeWithEmail
 * @returns {Object} - an Ajax call to fetch oAuth token
 */
function authenticateUserWithCode(authCode, scope) {
    const authenticateUserUrl = $('.authenticate-bolt-user').val();
    const reqBody = {
        code: authCode,
        scope: scope
    };
    return $.ajax({
        url: authenticateUserUrl,
        method: 'GET',
        data: reqBody,
        error: function (jqXHR, error) {
            console.log(error);
        }
    });
}

/**
 * Get Account Details.
 * This function passes the Oauth token to bolt and retrieve the account details of a shopper
 * @param {string} oAuthToken - oAuth Token
 * @returns {Object} - an ajax call to fetch account details
 */
function getAccountDetails(oAuthToken) {
    const accountDetailUrl = $('.get-bolt-account-details').val();
    const reqBody = {
        bearerToken: oAuthToken
    };
    return $.ajax({
        url: accountDetailUrl,
        method: 'GET',
        data: reqBody,
        success: function (data) {
            window.location.href = data.redirectUrl;
        },
        error: function (jqXHR, error) {
            console.log(error);
        }
    });
}

/**
 * Check Account And Fetch Detail
 * This function makes a call to bolt backend with the user email, and log the user into their bolt account if the user has one
 * at the end of the login flow we redirect the user to the final page where they can click place order so this function
 * doesn't return anything
 * @returns {void}
 */
exports.checkAccountAndFetchDetail = function () {
    const emailInput = $('#email-guest');
    const customerEmail = emailInput.val();
    const checkBoltAccountUrl = $('.check-bolt-account-exist').val() + '=' + encodeURIComponent(customerEmail);
    $.ajax({
        url: checkBoltAccountUrl,
        method: 'GET',
        success(data) {
            if (data !== null) {
                if (data.has_bolt_account) {
                    login(customerEmail);
                }
            }
        },
        error: function (jqXHR, error) {
            console.log(error);
        }
    });
};

/**
 * making an ajax call to sfcc backend to clear bolt account data
 */
exports.logout = function () {
    var url = $('#bolt-logout').attr('data-bolt-logout-url');
    $.ajax({
        url: url,
        method: 'POST',
        success: function (data) {
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        },
        error: function (err) {
            if (err.responseJSON.message) {
                $('.error-message').show();
                $('.error-message-text').text(err.responseJSON.message);
            }
        }
    });
};
