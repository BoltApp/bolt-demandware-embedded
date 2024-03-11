'use strict';

const account = require('../account');
const action = require('./actions');
const { run } = require('./run');
const { EventName } = require('./constants');
const eventEmitter = require('./event-emitter');

const initializeAnalytics = async () => {
    await account.waitForBoltReady;

    run({
        [EventName.CHECKOUT_LOADED]: [
            action.urlMatchParts(['checkout'], context => {
                const cartValue = document.querySelector('.grand-total-sum').textContent || '';
                const cartSubtotal = document.querySelector('.sub-total').textContent || '';
                const cart = buildCart(cartValue, cartSubtotal);
                context.summary = Object.assign(context.summary, cart);

                return cart;
            })
        ],
        [EventName.RECOGNITION_EMAIL_FIELD_CHANGED]: [action.input(window.BoltSelectors.checkoutEmailField)],

        [EventName.SHIPPING_STEP_ENTERED]: [
            action.stepChange(window.BoltSelectors.checkoutStepTracker, 'shipping')
        ],
        [EventName.SHIPPING_DETAILS_FULLY_ENTERED]: [
            action.areAllFieldsFilled([
                window.BoltSelectors.shippingFirstName,
                window.BoltSelectors.shippingLastName,
                window.BoltSelectors.shippingAddress1,
                window.BoltSelectors.shippingZipCode,
                window.BoltSelectors.shippingPhoneNumber
            ])
        ],
        // [EventName.SHIPPING_OPTION_SELECTED]: [],
        [EventName.SHIPPING_SUBMITTED]: [action.clickOnce(window.BoltSelectors.shippingSubmitButton)],
        [EventName.SHIPPING_EDIT_BUTTON_CLICKED]: [action.clickOnce(window.BoltSelectors.shippingEditButton)],

        [EventName.BILLING_STEP_ENTERED]: [
            action.stepChange(window.BoltSelectors.checkoutStepTracker, 'payment')
        ],
        [EventName.BILLING_ADDRESS_DETAILS_ENTERED]: [
            action.areAllFieldsFilled([
                window.BoltSelectors.billingFirstName,
                window.BoltSelectors.billingLastName,
                window.BoltSelectors.billingAddress1,
                window.BoltSelectors.billingCity,
                window.BoltSelectors.billingZipCode
            ])
        ],
        // [EventName.BILLING_PAYMENT_METHOD_SELECTED]: [],
        [EventName.BILLING_SUBMITTED]: [action.click(window.BoltSelectors.billingSubmitButton)],
        [EventName.BILLING_EDIT_BUTTON_CLICKED]: [
            action.clickOnce(window.BoltSelectors.billingEditButton)
        ],

        [EventName.PAYMENT_STEP_ENTERED]: [
            action.stepChange(window.BoltSelectors.checkoutStepTracker, 'placeOrder')
        ],
        [EventName.PAYMENT_PAY_BUTTON_CLICKED]: [action.clickOnce(window.BoltSelectors.payButton)],
        [EventName.PAYMENT_TOGGLE_REGISTRATION_CHECKBOX]: action.accountRegistrationCheckbox(window.BoltSelectors.boltAccountCheckbox),
        [EventName.PAYMENT_SUCCEEDED]: [
            (emit) => {
                eventEmitter.once(EventName.PAYMENT_SUCCEEDED, () => emit());
            },
            action.stepChange(window.BoltSelectors.checkoutStepTracker, 'submitted')
        ],
        [EventName.PAYMENT_FAILED]: [
            ((emit) => {
                const errorAlert = document.querySelector('.alert-danger.error-message');

                if (errorAlert == null) {
                    return false;
                }

                const observer = new MutationObserver(function (mutationsList) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            const displayStyle = errorAlert != null && errorAlert.style.display;
                            if (displayStyle !== 'none') {
                                emit({ error: errorAlert.textContent.trim() });
                            }
                        }
                    }
                });

                observer.observe(errorAlert, { attributes: true, attributeFilter: ['style'] });

                return true;
            }),
            (emit) => {
                eventEmitter.once(EventName.PAYMENT_FAILED, () => emit());
            }
        ]
    });
};

exports.initializeAnalytics = initializeAnalytics;

/**
 * @param {string} total Total sum of the cart
 * @param {string} subtotal Subtotal of the cart
 * @returns {Object} representing the cart totals
 */
function buildCart(total, subtotal) {
    return {
        cartValue: currencyToNumber(total),
        cartSubtotal: currencyToNumber(subtotal),
        cartTotalRaw: total || '',
        cartSubtotalRaw: subtotal || ''
    };
}

/**
 * @param {string} raw string representing a currency
 * @returns {string} representing a number or '-' if the input is not a valid currency
 */
function currencyToNumber(raw = '') {
    const currency = Number(raw.replace(/[^0-9.]/g, ''));
    return Number.isNaN(currency) ? '-' : currency;
}
