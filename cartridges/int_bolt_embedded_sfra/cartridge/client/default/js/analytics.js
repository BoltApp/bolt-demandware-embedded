'use strict';

/**
 * Checkout step complete event handler.
 * @param {string} eventName - The name of the event.
 * @param {Object} props - The event properties.
 */
function checkoutStepComplete(eventName, props) {
    if (window.BoltAnalytics == null) {
        return;
    }

    window.BoltAnalytics.checkoutStepComplete(eventName, props);
}

exports.checkoutStepComplete = checkoutStepComplete;
