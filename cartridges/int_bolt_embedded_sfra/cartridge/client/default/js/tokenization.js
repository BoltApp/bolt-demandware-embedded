'use strict';

var account = require('./account.js');

var accountCheck;
// set this value to false for the account creation checkbox to be default off
var boltCreateAccountCheckboxDefault = true;
var boltCreateAccount = boltCreateAccountCheckboxDefault;

var accountCheckOptions = {
    defaultValue: boltCreateAccountCheckboxDefault,
    version: 'compact',
    listeners: {
        change: function (value) {
            boltCreateAccount = value;
        }
    }
};

var renderBoltEmbeddedPaymentFields = function () {
    const paymentComponent = Bolt.create('payment_component');
    paymentComponent.mount(document.getElementById('div-to-inject-field-into'));
    return paymentComponent;
};

var getOrCreatePaymentComponent = function () {
    return window.Bolt.getComponent('payment_component') || renderBoltEmbeddedPaymentFields();
};

var renderBoltCreateAccountCheckField = function () {
    if (window.Bolt && $(window.BoltSelectors.boltAccountCheckbox).length > 0) {
        accountCheck = Bolt.create('account_checkbox', accountCheckOptions);
        accountCheck.mount(window.BoltSelectors.boltAccountCheckbox);
    }
};

var getToken = async function () {
    await account.waitForBoltReady();
    return getOrCreatePaymentComponent().tokenize();
};

var paymentSelected = function (paymentOptions) {
    var paymentATag = paymentOptions.find('.nav-link');
    for (let i = 0; i < paymentATag.length; i++) { // eslint-disable-line no-plusplus
        if (paymentATag[0].getAttribute('aria-selected') === 'true') {
            return true;
        }
    }
    return false;
};

var initEmbeddedPaymentFields = function () {
    var paymentOptions = $('.payment-options').children('li');
    if (paymentOptions.length > 0 && !paymentSelected(paymentOptions)) {
        $('[data-method-id="BOLT_PAY"] a').trigger('click');
    }
};

var resetBoltCreditCardFields = function () {
    $('#bolt-cc-token').val('');
    $('#bolt-cc-bin').val('');
    $('#bolt-cc-last-digits').val('');
    $('#bolt-cc-exp').val('');
    $('#bolt-cc-token-type').val('');
    $('#bolt-cc-network').val('');
    $('#bolt-cc-postal').val('');
};

var tokenize = function (event, options) {
    // reset credit card fields
    resetBoltCreditCardFields();
    getToken().then(
        function (response) {
            $('#bolt-cc-token').val(response.token);
            $('#bolt-cc-bin').val(response.bin);
            $('#bolt-cc-last-digits').val(response.last4);
            $('#bolt-cc-exp').val(response.expiration);
            $('#bolt-cc-token-type').val(response.token_type);
            $('#bolt-cc-network').val(response.network);
            $('#bolt-cc-postal').val(response.postal_code);
            $('#bolt-cc-create-account').val(boltCreateAccount);
            options.resolve();
        },
        function (error) {
            console.log('Error on getting Bolt token: ', error);
            options.reject();
        }
    );
};

$('body').ready(async function () {
    await account.waitForBoltReady();

    initEmbeddedPaymentFields();
    renderBoltCreateAccountCheckField();
});

$('[data-method-id="BOLT_PAY"]').click(function () {
    renderBoltEmbeddedPaymentFields();
});

$('body').on('checkout:tokenize', tokenize);
