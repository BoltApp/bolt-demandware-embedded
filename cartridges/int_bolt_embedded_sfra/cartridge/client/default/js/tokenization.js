'use strict';

var util = require('./util.js');

var paymentComponent;
var boltEmbedded;
var accountCheck;
var accountCheckboxDefaultValue = true;
var boltCreateAccount = accountCheckboxDefaultValue;

var accountCheckOptions = {
    defaultValue: accountCheckboxDefaultValue,
    version: 'compact',
    listeners: {
        change: function (value) {
            boltCreateAccount = value;
        }
    }
};

var renderBoltEmbeddedPaymentFields = function () {
    if (paymentComponent == null && boltEmbedded) {
        paymentComponent = boltEmbedded.create('payment_component');
        paymentComponent.mount(document.getElementById('div-to-inject-field-into'));
    }
};

var renderBoltCreateAccountCheckField = function () {
    if (boltEmbedded && $('#acct-checkbox').length > 0) {
        accountCheck = boltEmbedded.create('account_checkbox', accountCheckOptions);
        accountCheck.mount('#acct-checkbox');
    }
};

var getToken = async function () {
    return paymentComponent.tokenize();
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

$('body').ready(function () {
    var isBoltEmbeddedExists = setInterval(function () {
        if (typeof Bolt !== 'undefined') {
            clearInterval(isBoltEmbeddedExists);
            const locale = $('.bolt-locale').val();
            boltEmbedded = Bolt($('.bolt-publishable-key').val(), { language: util.getISOCodeByLocale(locale) }); // eslint-disable-line no-undef
            initEmbeddedPaymentFields();
            renderBoltCreateAccountCheckField();
        }
    }, 500);
});

$('[data-method-id="BOLT_PAY"]').click(function () {
    renderBoltEmbeddedPaymentFields();
});

$('body').on('checkout:tokenize', tokenize);
