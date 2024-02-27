'use strict';

const account = require('./account');
const boltStoredPayment = require('./boltStoredPayments');

$(document).ready(async function () {
    $('.submit-customer').attr('disabled', 'true');

    // mount on the div container otherwise the iframe won't render
    const emailField = document.querySelector(window.BoltSelectors.checkoutEmailField).parentElement;

    if (emailField == null) {
        return;
    }

    await account.waitForBoltReady();

    const loginModalComponent = Bolt.getComponent('login_modal') || Bolt.create('login_modal');

    if (emailField != null) {
        loginModalComponent.attach(emailField);
    }

    const isBoltShopperLoggedIn = $('.bolt-is-shopper-logged-in').val() === 'true';
    const boltSFCCSessionLogoutCookie = account.getCookie('bolt_sfcc_session_logout');

    if (!isBoltShopperLoggedIn && boltSFCCSessionLogoutCookie !== 'true') {
        account.detectSessionLogin(loginModalComponent);
    }

    account.setupListeners();
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

// mount login status component
$(document).ready(async function () {
    await account.waitForBoltReady();

    account.mountLoginStatusComponent();
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
