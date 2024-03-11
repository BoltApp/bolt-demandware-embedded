/* eslint-disable no-restricted-syntax */

'use strict';

const click = event('click');

module.exports = {
    waitFor,
    urlMatchParts,
    observeSelector,
    render,
    event,
    click,
    input: event('input'),
    change: event('change'),
    clickOnce: event('click', true),
    inputOnce: event('input', true),
    areAllFieldsFilled,
    accountRegistrationCheckbox,
    stepChange
};

const noop = () => {};

// Don't use this function for selector matching. Use observeSelector instead.
/**
 * Waits for a condition to be true and emits an event.
 * @param {Function} fn - The condition function.
 * @param {Function} [eventData=noop] - The event data function.
 * @returns {boolean} - True if the condition is met, false otherwise.
 */
function waitFor(fn, eventData = noop) {
    return (emit, context) => {
        if (fn(context)) {
            emit(eventData(context));
            return true;
        }
        return false;
    };
}

/**
 * Matches URL parts and waits for the condition to be true.
 * @param {string[]} urlSubstrings - The URL substrings to match.
 * @param {Function} [eventData=noop] - The event data function.
 * @param {Location} [location=window.location] - The location object.
 * @returns {boolean} - True if the condition is met, false otherwise.
 */
function urlMatchParts(urlSubstrings, eventData = noop, location = window.location) {
    const lowercase = urlSubstrings.map(url => url.toLowerCase());
    const partsMatch = () => lowercase.every(part => location.href.toLowerCase().includes(part));

    return waitFor(partsMatch, eventData);
}

/**
 * Observes elements matching a selector and invokes a callback for each element.
 * @param {string} selector - The CSS selector.
 * @param {Function} callback - The callback function.
 * @returns {boolean} - Always returns true.
 */
function observeSelector(selector, callback) {
    return (emit, context) => {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
            callback(emit, context, element, { disconnect: () => undefined });
        }

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }

                    const target = node.matches(selector) ? node : node.querySelector(selector);
                    if (target != null) {
                        callback(emit, context, target, observer);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return true;
    };
}

/**
 * Renders the specified selector and emits an event.
 * @param {string} selector - The CSS selector.
 * @param {Function} [eventData=noop] - The event data function.
 * @returns {boolean} - Always returns true.
 */
function render(selector, eventData = noop) {
    return observeSelector(selector, (emit, context, target, observer) => {
        emit(eventData({ context, target }));
        observer.disconnect();
    });
}

/**
 * Creates an event listener function.
 * @param {string} name - The event name.
 * @param {boolean} once - Whether the event should be listened to only once.
 * @returns {Function} - The event listener function.
 */
function event(name, once = false) {
    return function (selector, eventData = noop) {
        return observeSelector(selector, (emit, context, target, observer) => {
            target.addEventListener(name, (eventObj) => {
                emit(eventData({ event: eventObj, context }));

                if (once) {
                    observer.disconnect();
                }
            }, { once });
        });
    };
}

/**
 * Checks if all fields specified by the selectors are filled.
 * @param {string[]} selectors - The CSS selectors for the fields.
 * @returns {boolean} - True if all fields are filled, false otherwise.
 */
function areAllFieldsFilled(selectors) {
    const unsubscribes = [];
    const elementsMap = new Map();

    return (emit, context) => {
        for (const selector of selectors) {
            observeSelector(selector, (_, _1, target, observer) => {
                elementsMap.set(selector, target);

                const onBlur = () => {
                    const allFilled = Array.from(elementsMap.values()).every(input => input.value !== '');
                    if (allFilled) {
                        emit();
                        unsubscribes.forEach(unsubscribe => unsubscribe());
                    }
                };
                target.addEventListener('blur', onBlur);

                unsubscribes.push(() => {
                    target.removeEventListener('blur', onBlur);
                    observer.disconnect();
                });
            })(emit, context);
        }

        return true;
    };
}

/**
 * Returns an array of functions for handling account registration checkbox.
 * @param {string} selector - The CSS selector for the checkbox.
 * @returns {Function[]} - Array of functions.
 */
function accountRegistrationCheckbox(selector) {
    return [
        render(selector, ({ context, target }) => accountRegistrationChecked(context, target)),
        click(selector, ({ context, event: clickEvent }) => accountRegistrationChecked(context, clickEvent.target))
    ];
}

/**
 * Updates the account registration checked status in the context and returns the updated status.
 * @param {Object} context - The context object.
 * @param {HTMLElement} target - The target element.
 * @returns {Object} - The updated status object.
 */
function accountRegistrationChecked(context, target) {
    context.summary.createBoltAccountChecked = target.checked;
    return { checked: context.summary.createBoltAccountChecked };
}

/**
 * Performs a step change.
 * @param {string} selector - The CSS selector.
 * @param {string} stage - The stage of the step change.
 * @param {Function} [eventData=noop] - The event data function.
 * @returns {boolean} - Always returns true.
 */
function stepChange(selector, stage, eventData = noop) {
    return (emit, context) => {
        const target = document.querySelector(selector);
        const initStage = target.getAttribute('data-checkout-stage');
        if (initStage === stage) {
            emit(eventData(context));
            return true;
        }

        const stageObserver = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-checkout-stage') {
                    const currentStage = mutation.target.getAttribute('data-checkout-stage');
                    if (currentStage === stage) {
                        emit(eventData(context));
                    }
                }
            }
        });
        stageObserver.observe(target, { attributes: true, attributeFilter: ['data-checkout-stage'] });

        return true;
    };
}
