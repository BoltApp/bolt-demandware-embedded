'use strict';

exports.EventName = {
    CHECKOUT_LOADED: 'checkout . loaded',

    RECOGNITION_EMAIL_FIELD_CHANGED: 'recognition . email field changed',

    SHIPPING_STEP_ENTERED: 'shipping . step entered',
    SHIPPING_DETAILS_FULLY_ENTERED: 'shipping . details fully entered',
    SHIPPING_OPTION_SELECTED: 'shipping . option selected',
    SHIPPING_SUBMITTED: 'shipping . submitted',
    SHIPPING_EDIT_BUTTON_CLICKED: 'shipping . edit button clicked',

    BILLING_STEP_ENTERED: 'billing . step entered',
    BILLING_ADDRESS_DETAILS_ENTERED: 'billing . address details entered',
    BILLING_PAYMENT_METHOD_SELECTED: 'billing . payment method selected',
    BILLING_SUBMITTED: 'billing . submitted',
    BILLING_EDIT_BUTTON_CLICKED: 'billing . edit button clicked',

    PAYMENT_STEP_ENTERED: 'payment . step entered',
    PAYMENT_PAY_BUTTON_CLICKED: 'payment . pay button clicked',
    PAYMENT_SUCCEEDED: 'payment . succeeded',
    PAYMENT_FAILED: 'payment . failed',
    PAYMENT_TOGGLE_REGISTRATION_CHECKBOX: 'payment . toggle registration checkbox'
};
