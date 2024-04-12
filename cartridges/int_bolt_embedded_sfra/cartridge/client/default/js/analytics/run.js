'use strict';

const { EventName } = require('./constants');
const eventEmitter = require('./event-emitter');

module.exports = {
    run,
    paymentSucceeded() {
        eventEmitter.emit(EventName.PAYMENT_COMPLETE);
    },
    paymentFailed() {
        eventEmitter.emit(EventName.PAYMENT_REJECTED);
    }
};

/**
 * Runs the checkout event listeners and attaches them to the DOM.
 * @param {Object} checkoutEventListeners - The checkout event listeners.
 * @returns {Function} - A function to disconnect the observer and clear the attached listeners.
 */
function run(checkoutEventListeners) {
    const attachedListeners = new Set();

    addGlobalProperties({ source: 'sfcc' });

    const sharedContext = { emittedEvents, summary: {} };

    // Attempt to attach listeners to the DOM immediately
    attachListeners(checkoutEventListeners, sharedContext, attachedListeners);

    // If the listener was not attached above, it will be attempted to be attached again on every DOM change.
    // This is necessary because the element is not always rendered immediately and may depend on an action to occur.
    const observer = new MutationObserver(function () {
        attachListeners(checkoutEventListeners, sharedContext, attachedListeners);
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });

    return () => {
        observer.disconnect();
        attachedListeners.clear();
    };
}

/**
 * Attaches listeners to the checkout event listeners and emits events with properties.
 * @param {Object} checkoutEventListeners - The checkout event listeners.
 * @param {Object} context - The context object.
 * @param {Set} attachedListeners - The attached listeners.
 */
function attachListeners(checkoutEventListeners, context, attachedListeners) {
    Object.entries(checkoutEventListeners).forEach(([eventName, listeners]) => {
        listeners.forEach((listener) => {
            if (attachedListeners.has(listener)) {
                return;
            }

            const emit = (data, isCustomEvent = false) => {
                emitEventWithProperties(eventName, { eventData: () => data, isCustomEvent }, context);
            };
            const attached = listener(emit, context);
            if (attached) {
                attachedListeners.add(listener);
            }
        });
    });
}

const emittedEvents = new Set();
// By default, duplicated events are not emitted. This is to prevent
// network latency and perceived client-side performance issues. Some
// events should be emitted multiple times such as user element interaction
const allowedDuplicateEvents = new Set([
    EventName.SHIPPING_OPTION_SELECTED,
    EventName.BILLING_PAYMENT_METHOD_SELECTED,
    EventName.PAYMENT_PAY_BUTTON_CLICKED,
    EventName.PAYMENT_TOGGLE_REGISTRATION_CHECKBOX,
    EventName.PAYMENT_FAILED
]);

/**
 * Emits a checkout funnel event. By default, events are only emitted once. To emit duplicate events, pass { includeDuplicates: true } in the options argument.
 * @param {string} eventName - The name of the event to emit.
 * @param {Object} listener - The listener object.
 * @param {Object} context - The context object.
 */
function emitEventWithProperties(eventName, listener, context) {
    const eventData = listener.eventData ? listener.eventData(context) : undefined;
    const allowDuplicateEvent = allowedDuplicateEvents.has(eventName);

    if (!allowDuplicateEvent && emittedEvents.has(eventName)) {
        return;
    }

    emittedEvents.add(eventName);

    if (window.BoltAnalytics == null) {
        return;
    }
    window.BoltAnalytics.checkoutStepComplete(eventName, eventData);
}

/**
 * Adds global properties to Bolt Analytics.
 * @param {Object} properties - The global properties to add.
 */
function addGlobalProperties(properties) {
    if (window.BoltAnalytics == null) {
        return;
    }
    window.BoltAnalytics.addGlobalProperties(properties);
}
