'use strict';

var util = require('./util.js');

/**
 * Authorize With Email
 * @param {string} customerEmail - input email
 * @returns {Promise} - authroize promise
 */
async function authorizeWithEmail(customerEmail) {
    const boltPublishableKey = $('.bolt-publishable-key').val();
    const locale = $('.bolt-locale').val();

    const boltEmbedded = Bolt(boltPublishableKey, { language: util.getISOCodeByLocale(locale) }); // eslint-disable-line no-undef

    const authorizationComponent = boltEmbedded.create('authorization_component', { style: { position: 'right' } });
    await authorizationComponent.mount('.card.customer-section'); // mount on the div container otherwise the iframe won't render

    return authorizationComponent.authorize({ email: customerEmail });
}

/**
 * Authorize Bolt User
 * @param {string} email - input email
 * @returns {Promise} Promise for Account Details
 */
async function authorizeUser(email) {
    const authorizeWithEmailResp = await authorizeWithEmail(email);
    if (!authorizeWithEmailResp) return;
    const OAuthResp = await authenticateUserWithCode(authorizeWithEmailResp.authorizationCode, authorizeWithEmailResp.scope);
    return getAccountDetails(OAuthResp.accessToken); // eslint-disable-line consistent-return
}

/**
 * Authenticate User With Code
 * @param {string} authCode - auth Code
 * @param {string} scope - scope
 * @returns {Object} - result of Ajax call
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
 * Get Account Details
 * @param {string} oAuthToken - oAuth Token
 * @returns {Object} - result of Ajax call to get account details
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
 * @returns {void}
 */
function checkAccountAndFetchDetail() {
    const emailInput = $('#email-guest');
    const customerEmail = emailInput.val();
    const checkBoltAccountUrl = $('.check-bolt-account-exist').val();
    const reqBody = {
        email: customerEmail
    };
    $.ajax({
        url: checkBoltAccountUrl,
        method: 'GET',
        data: reqBody,
        success(data) {
            if (data !== null) {
                if (data.hasBoltAccount) {
                    authorizeUser(customerEmail);
                }
            }
        },
        error: function (jqXHR, error) {
            console.log(error);
        }
    });
    // Unbiding the callback to avoid triggering OTP modal many times
    emailInput.unbind('focusout');
}

// register the event listener on the $('#email-guest') component
// change the html element ID if you make change to $('#email-guest')
$(document).ready(function () {
    const emailInputLoaded = setInterval(function () {
        const emailInput = $('#email-guest');
        if (emailInput) {
            clearInterval(emailInputLoaded);
            // we chose onfocusout callback to trigger the OTP modal. feel free to use a different callback if you'd like a different user experience
            emailInput.focusout(checkAccountAndFetchDetail);
        }
    }, 100);
});

// register the event listener on the logout button
$('#bolt-logout').click(function () {
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
});
