'use strict';

var util = require('./util.js');
var constants = require('./constant.js');
var analytics = require('./analytics.js');

/**
 * This function uses the authCode and scope returned from authorizeWithEmail
 * after the user enters the 6 digits OTP code
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
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        },
        error: function (jqXHR, error) {
            console.log(error);
        }
    });
}

/**
 * Get Account Details for login.
 * This function passes the authCode and scope to authenticate the user and retrieve the account details.
 * @param {string} authCode - auth Code
 * @param {string} scope - scope
 * @returns {Object} - an ajax call to fetch account details
 */
function getAccountDetailsLogin(authCode, scope) {
    const accountDetailUrl = $('.authenticate-bolt-user-login').val();
    const reqBody = {
        code: authCode,
        scope: scope
    };
    return $.ajax({
        url: accountDetailUrl,
        method: 'GET',
        data: reqBody,
        success: function (data) {
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        },
        error: function (_jqXHR, error) {
            console.error(error);
        }
    });
}

/**
 * making an ajax call to sfcc backend to clear bolt account data
 */
exports.logout = function () {
    var url = $('.data-bolt-platform-side-logout-url').val();
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

/**
 * mount bolt login status component
 */
exports.mountLoginStatusComponent = function () {
    const loginStatusComponent = Bolt.create('login_status', {
        listeners: {
            logout: () => {
                this.logout();
            }
        }
    });
    if ($('#login-status').length > 0) {
        loginStatusComponent.mount('#login-status');
    }
};

/**
 * Display Bolt login status from iframe
 */
exports.displayBoltStatus = function () {
    $('#login-status').show();
    $('#bolt-platform-side-logout').hide();
    $('#default-customer-status').hide();
};

/**
 * Display Storefront Customer Information
 */
exports.displayCustomerInfo = function () {
    $('#bolt-platform-side-logout').show();
    $('#default-customer-status').show();
    $('#login-status').hide();
};

/**
 * Get cookie from browser
 * @param {string} cookieName - cookie name
 * @returns {string} cookie value
 */
exports.getCookie = function (cookieName) {
    let name = cookieName + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) { // eslint-disable-line no-plusplus
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

exports.setupListenersLogin = async function () {
    Bolt.on('login_complete', ({ result }) => {
        if (!(result instanceof Error)) {
            getAccountDetailsLogin(result.authorizationCode, result.scope);
        }
    });
};

exports.setupListeners = async function () {
    Bolt.on('login_complete', response => {
        if (!(response.result instanceof Error)) {
            (async function (authorizeResp) {
                const OAuthResp = await authenticateUserWithCode(
                    authorizeResp.authorizationCode,
                    authorizeResp.scope
                );
                return getAccountDetails(OAuthResp.accessToken);
            }(response.result));
        }
    });

    Bolt.on('login_modal_closed', () => {
        var disabledAttr = $('.submit-customer').prop('disabled');
        if (disabledAttr) {
            $('.submit-customer').removeAttr('disabled');
        }
    });

    Bolt.on('auto_account_check_complete', response => {
        const $accountCheckbox = $('#acct-checkbox');
        if (response.result instanceof Error) {
            if (response.result.message === 'Invalid email') {
                $('.submit-customer').attr('disabled', 'true');
            }
            return;
        }
        if (response.result) {
            if ($accountCheckbox) {
                $accountCheckbox.hide();
            }
        } else {
            $('.submit-customer').removeAttr('disabled');
            if ($accountCheckbox) {
                $accountCheckbox.show();
            }
        }
        analytics.checkoutStepComplete(constants.EventAccountRecognitionCheckPerformed, { hasBoltAccount: response.result, detectionMethod: 'email' });
    });
};

var boltReadyPromise = new Promise(resolve => {
    const timer = setInterval(function () {
        if (window.Bolt == null) {
            return;
        }

        if (!Bolt.isInitialized) {
            const { publishableKey, locale } = window.BoltConfig || {};
            Bolt.initialize(publishableKey, {
                language: util.getISOCodeByLocale(locale)
            });
        }

        clearInterval(timer);
        resolve();
    }, 500);
});

exports.waitForBoltReady = function () {
    return boltReadyPromise;
};
