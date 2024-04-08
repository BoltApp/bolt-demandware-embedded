'use strict';

exports.EventName = {
    CHECKOUT_LOADED: 'Checkout | loaded',

    RECOGNITION_EMAIL_FIELD_CHANGED: 'Recognition | email field changed',

    SHIPPING_STEP_ENTERED: 'Shipping | step entered',
    SHIPPING_DETAILS_FULLY_ENTERED: 'Shipping | details fully entered',
    SHIPPING_OPTION_SELECTED: 'Shipping | option selected',
    SHIPPING_SUBMITTED: 'Shipping | submitted',
    SHIPPING_EDIT_BUTTON_CLICKED: 'Shipping | edit button clicked',

    BILLING_STEP_ENTERED: 'Billing | step entered',
    BILLING_ADDRESS_DETAILS_ENTERED: 'Billing | address details entered',
    BILLING_PAYMENT_METHOD_SELECTED: 'Billing | payment method selected',
    BILLING_SUBMITTED: 'Billing | submitted',
    BILLING_EDIT_BUTTON_CLICKED: 'Billing | edit button clicked',

    PAYMENT_STEP_ENTERED: 'Payment | step entered',
    PAYMENT_PAY_BUTTON_CLICKED: 'Payment | pay button clicked',
    PAYMENT_SUCCEEDED: 'Payment | succeeded',
    PAYMENT_FAILED: 'Payment | failed',
    PAYMENT_TOGGLE_REGISTRATION_CHECKBOX: 'Payment | toggle registration checkbox'
};
