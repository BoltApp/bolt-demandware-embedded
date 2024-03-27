'use strict';

exports.EventName = {
    CHECKOUT_LOADED: 'Checkout | loaded',

    RECOGNITION_EMAIL_FIELD_CHANGED: 'Recognition | email field changed',

    // Handled in embed.js
    // CHECKOUT_BOLT_VARIANT: "Checkout | bolt variant",
    // RECOGNITION_ACCOUNT_RECOGNITION_CHECK_PERFORMED: "Recognition | account recognition check performed",
    // LOGIN_OTP_RESENT: "Login | OTP resent",
    // LOGIN_PHONE_VALIDATION_PROMPTED: "Login | phone validation prompted",
    // LOGIN_PHONE_ADDITION_PROMPTED: "Login | phone addition prompted",
    // LOGIN_ATTEMPT_BEGAN: "Login | attempt began",
    // LOGIN_SUCCEEDED: "Login | succeeded",
    // LOGIN_FAILED: "Login | failed",
    // LOGIN_AUTH_MODAL_EXITED: "Login | auth modal exited",

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

    // optional. Handled in embed.js
    // MASTERCARD_DIFFERENT_OTP_CHANNEL_SELECTED: "Mastercard | different OTP channel selected",
    // MASTERCARD_ACCOUNT_RECOGNITION_CHECK_PERFORMED: "Mastercard | account recognition check performed",
    // MASTERCARD_CARD_SELECTION_PROMPT: "Mastercard | card selection prompt",
    // MASTERCARD_DEFAULT_CARD_CHANGED: "Mastercard | default card changed",
    // MASTERCARD_CARD_SELECTION_SUCCEEDED: "Mastercard | card selection succeeded",
    // MASTERCARD_NO_VALID_CREDIT_CARD: "Mastercard | no valid credit card",
    // MASTERCARD_CTP_SUCCEEDED: "Mastercard | CTP succeeded",

    // SSO_ACCOUNT_CREATION_BEGAN: "SSO | account creation began",
    // SSO_ACCOUNT_CREATION_SUCCEEDED: "SSO | account creation succeeded",
    // SSO_ACCOUNT_CREATION_FAILED: "SSO | account creation failed",
    // SSO_ACCOUNT_VERIFICATION_SUCCEEDED: "SSO | account verification succeeded",
    // SSO_ACCOUNT_VERIFICATION_FAILED: "SSO | account verification failed",
    // SSO_PASSWORDLESS_SIGN_IN_BUTTON_RENDERED: "SSO | passwordless sign in button rendered",
    // SSO_PASSWORDLESS_SIGN_IN_BUTTON_CLICKED: "SSO | passwordless sign in button clicked",
};
