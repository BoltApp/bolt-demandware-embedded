'use strict';

const account = require('./account');
const util = require('./util');
const boltStoredPayment = require('./boltStoredPayments');

// register the event listener on the $('#email-guest') component
// change the html element ID if you make change to $('#email-guest')
$(document).ready(function () {
    $('.submit-customer').attr('disabled', 'true');
    const isBoltEmbeddedExists = setInterval(async function () {
        const containerToMount = $('#email-guest').parent().get(0);
        if (typeof Bolt === 'undefined' || containerToMount.offsetParent === null) {
            return;
        }
        clearInterval(isBoltEmbeddedExists);
        const boltPublishableKey = $('.bolt-publishable-key').val();
        const locale = $('.bolt-locale').val();

        const boltEmbedded = Bolt(boltPublishableKey, { // eslint-disable-line no-undef
            language: util.getISOCodeByLocale(locale)
        });

        const authorizationComponent = boltEmbedded.create('authorization_component', {
            style: { position: 'right' },
            autoAuthorize: true
        });
        containerToMount.classList.add('containerToMount');
        await authorizationComponent.mount('.containerToMount'); // mount on the div container otherwise the iframe won't render
        account.setupListeners(authorizationComponent);
    }, 500);
});

// register the event listener on the logout button
$('#bolt-platform-side-logout').click(function () {
    account.logout();
});

// register the event listener to the radio buttons for selecting stored payments
$(document).ready(function () {
    const radioButtonLoaded = setInterval(function () {
        const useExistingCardBtn = $('#use-existing-card-radio-button');
        const addNewCardBtn = $('#add-a-new-card-radio-button');
        if (useExistingCardBtn && addNewCardBtn) {
            clearInterval(radioButtonLoaded);
            useExistingCardBtn.click(function () {
                if (this.checked) {
                    $('#bolt-stored-payment-selector').removeClass('d-none');
                    $('.bolt-pay').addClass('d-none');
                    boltStoredPayment.setBoltStoredPaymentMethodID();
                }
            });

            addNewCardBtn.click(function () {
                if (this.checked) {
                    $('#bolt-stored-payment-selector').addClass('d-none');
                    $('.bolt-pay').removeClass('d-none');
                    $('#bolt-selected-payment-id').val('');
                }
            });
        }
    }, 100);

    const boltPaySelectorLoaded = setInterval(function () {
        const boltPaySelector = $('#bolt-stored-payment-selector');
        if (boltPaySelector) {
            clearInterval(boltPaySelectorLoaded);
            boltStoredPayment.setBoltStoredPaymentMethodID();
            boltPaySelector.change(function () {
                boltStoredPayment.setBoltStoredPaymentMethodID();
                boltStoredPayment.updateBillingAddress();
            });
        }
    }, 100);
});

// detect auto login
$(document).ready(function () {
    var isBoltEmbeddedExists = setInterval(function () {
        if (typeof Bolt !== 'undefined') {
            clearInterval(isBoltEmbeddedExists);
            const isBoltShopperLoggedIn = $('.bolt-is-shopper-logged-in').val();
            var boltSFCCSessionLogoutCookie = account.getCookie('bolt_sfcc_session_logout');
            if (isBoltShopperLoggedIn === 'false' && boltSFCCSessionLogoutCookie !== 'true') {
                account.detectAutoLogin();
            }
        }
    }, 500);
});

// mount login status component
$(document).ready(function () {
    var isBoltEmbeddedExists = setInterval(function () {
        if (typeof Bolt !== 'undefined') {
            clearInterval(isBoltEmbeddedExists);
            account.mountLoginStatusComponent();
        }
    }, 500);
});

/**
 * Due to a limitation of login status component
 * Some browser like safari/chrome incognito is not
 * able to display the login status component.
 * The purpose of this function is to wait 2 seconds
 * and see if the login status component is able to be
 * displayed, otherwise display the default content, which
 * is same as the previous one.
 */
$(window).on('load', function () {
    const isBoltShopperLoggedIn = $('.bolt-is-shopper-logged-in').val();
    if (isBoltShopperLoggedIn === 'true') {
        setTimeout(function () {
            var isBoltStatusComponentDisplay = false;
            var $boltLoginStatusDiv = $('#login-status');
            if ($boltLoginStatusDiv.contents().length > 0) {
                isBoltStatusComponentDisplay = $boltLoginStatusDiv.contents().get(0).style.display !== '';
            }
            if (isBoltStatusComponentDisplay) {
                account.displayBoltStatus();
            } else {
                account.displayCustomerInfo();
            }
        }, 2000);
    } else {
        account.displayCustomerInfo();
    }
});
