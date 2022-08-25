'use strict';

const account = require('./account');
const util = require('./util');
const boltStoredPayment = require('./boltStoredPayments');

// register the event listener on the $('#email-guest') component
// change the html element ID if you make change to $('#email-guest')
$(document).ready(function () {
    const emailInputLoaded = setInterval(function () {
        const emailInput = $('#email-guest');
        if (emailInput) {
            clearInterval(emailInputLoaded);
            var checkBoltAccountTimeOut;
            $('.submit-customer').attr('disabled', 'true'); // disable the checkout button by default
            emailInput.keyup(function () {
                clearTimeout(checkBoltAccountTimeOut);
                checkBoltAccountTimeOut = setTimeout(function () {
                    if (util.validateEmail(emailInput.val())) {
                        // disable the checkout button in case that we checked Bolt account with the typing unfinished email address and checkout button was enabled after that
                        $('.submit-customer').attr('disabled', 'true');
                        account.checkAccountAndFetchDetail();
                    }
                }, 1000);
            });
        }
    }, 100);
});

// register the event listener on the logout button
$('#bolt-logout').click(function () {
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
