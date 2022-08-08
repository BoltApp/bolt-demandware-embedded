'use strict';

/**
 * Adding bolt pay id to payment content so that it's sent to auth when clicking "Place Order"
 * @returns {void}
 */
function setBoltStoredPaymentMethodID() {
    const boltPayID = $('#bolt-stored-payment-selector option:selected').val();
    $('#bolt-selected-payment-id').attr('value', boltPayID);
}

/**
 * Update billing address when user choose a different card
 * @returns {void}
 */
function updateBillingAddress() {
    var billingAddress = getSelectedCardBillingAddress();
    var form = $('form[name=dwfrm_billing]');
    if (!form || !billingAddress) {
        return;
    }

    var firstName = billingAddress.first_name || '';
    var lastName = billingAddress.last_name || '';
    var address1 = billingAddress.street_address1 || '';
    var address2 = billingAddress.street_address2 || '';
    var city = billingAddress.locality || '';
    var stateCode = billingAddress.region_code || '';
    var postalCode = billingAddress.postal_code || '';
    var countryCode = billingAddress.country_code || '';
    var phoneNumber = billingAddress.phone_number || '';

    // update billing form
    $('input[name$=_firstName]', form).val(firstName);
    $('input[name$=_lastName]', form).val(lastName);
    $('input[name$=_address1]', form).val(address1);
    $('input[name$=_address2]', form).val(address2);
    $('input[name$=_city]', form).val(city);
    $('input[name$=_postalCode]', form).val(postalCode);
    $('select[name$=_stateCode],input[name$=_stateCode]', form).val(stateCode);
    $('select[name$=_country]', form).val(countryCode);
    $('input[name$=_phone]', form).val(phoneNumber);

    // update billing address selector
    var billingAddressSelector = $('#billingAddressSelector option:selected');
    var selectorText = firstName + ' ' + lastName + ' ' + address1 + ' ' + address2 + ' ' + city + ', ' + stateCode + ' ' + postalCode;
    billingAddressSelector.text(selectorText);
}

/**
 * Get the corresponding billing address of the selected card stored in Bolt account
 * @returns {Object} billing address data if found otherwise null
 */
function getSelectedCardBillingAddress() {
    var boltStoredPayment = $('#bolt-stored-paymentmethods').val();
    if (boltStoredPayment === '') return null;

    boltStoredPayment = JSON.parse(boltStoredPayment);
    var boltPaymentId = $('#bolt-selected-payment-id').val();

    // loop all bolt stored payment
    for (var index in boltStoredPayment) { // eslint-disable-line no-restricted-syntax
        if (boltStoredPayment[index].id === boltPaymentId) {
            return boltStoredPayment[index].billing_address;
        }
    }
    return null;
}

module.exports = {
    setBoltStoredPaymentMethodID: setBoltStoredPaymentMethodID,
    updateBillingAddress: updateBillingAddress
};
