'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var Cookie = require('dw/web/Cookie');
var CustomerMgr = require('dw/customer/CustomerMgr');

var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('~/cartridge/scripts/util/constants');
var log = LogUtils.getLogger('Account');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var OAuthUtils = require('~/cartridge/scripts/util/oauthUtils');
var JWTUtils = require('~/cartridge/scripts/util/jwtUtils');

/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {Object} shopperDetails - shopper's profile
 * @returns {Object} result - if we need to redirect to shipping
 *                   & billing page when there are missing values
 */
exports.addAccountDetailsToBasket = function (shopperDetails) {
    var res = {};
    try {
        log.debug('Shopper Info to add to basket {0}', JSON.stringify(shopperDetails));
        var basket = BasketMgr.getCurrentBasket();

        // set shopper detail to shipping address
        var boltDefaultAddress;
        shopperDetails.addresses.forEach(function (address) {
            if (address.default === true) {
                boltDefaultAddress = address;
            }
        });
        // preset phone number in shipping/billing address if missing
        presetPhoneNumber(shopperDetails);
        // save bolt shipping addresses in basket
        if (shopperDetails.addresses) {
            var shopperAddresses = JSON.stringify(shopperDetails.addresses);
            Transaction.wrap(function () {
                basket.custom.boltShippingAddress = shopperAddresses;
            });
        }

        if (boltDefaultAddress) {
            collections.forEach(basket.getShipments(), function (shipment) {
                if (!shipment.getShippingAddress()) {
                    Transaction.wrap(function () {
                        shipment.createShippingAddress();
                    });
                }
                if (!shipment.getShippingMethod()) {
                    Transaction.wrap(function () {
                        shipment.setShippingMethod(ShippingMgr.getDefaultShippingMethod());
                    });
                }

                // save Bolt address ID to shipping address
                var shippingAddress = shipment.getShippingAddress();
                Transaction.wrap(function () {
                    shippingAddress.custom.boltAddressId = boltDefaultAddress.id;
                });

                var addAddressResult = addAccountDetailsToAddress(
                    boltDefaultAddress,
                    shippingAddress
                );
                if (addAddressResult.missingValue) {
                    res.redirectShipping = true;
                }
            });
        } else {
            log.warn('default shipping address is missing from shopper details!');
            res.redirectShipping = true;
        }

        // adding payment methods to the basket's custom field
        var addPaymentResult = addPaymentMethodInfoToBasket(basket, shopperDetails.payment_methods);

        if (addPaymentResult.missingValue) {
            res.redirectBilling = true;
        }

        // set email to the basket
        Transaction.wrap(function () {
            basket.setCustomerEmail(shopperDetails.profile.email);
        });
    } catch (e) {
        log.error(e.message);
    }

    return res;
};

/**
 * Adding the account details to the address on basket
 * @param {Object} boltAddress - address from bolt account
 * @param {dw.order.OrderAddress} address - address on the basket
 * @return {Object} res - if there are missing values in the input
 */
function addAccountDetailsToAddress(boltAddress, address) {
    var phone = boltAddress.phone_number || '';
    var firstName = boltAddress.first_name || '';
    var lastName = boltAddress.last_name || '';
    var address1 = boltAddress.street_address1 || '';
    var city = boltAddress.locality || '';
    var stateCode = boltAddress.region_code || '';
    var countryCode = boltAddress.country_code || '';
    var postalCode = boltAddress.postal_code || '';
    Transaction.wrap(function () {
        address.setPhone(phone);
        address.setFirstName(firstName);
        address.setLastName(lastName);
        address.setAddress1(address1);
        address.setCity(city);
        address.setStateCode(stateCode);
        address.setCountryCode(countryCode);
        address.setPostalCode(postalCode);
    });
    if (boltAccountUtils.checkEmptyValue(
        [phone, firstName, lastName, address1, city, stateCode, countryCode, postalCode]
    )) {
        log.warn('address information incomplete');
        return {
            missingValue: true
        };
    }
    return {
        missingValue: false
    };
}

/**
 * Adding the payment information from bolt account to basket, as a string
 * We can't create payment instruments on the baskets as the payment methods
 * from the bolt account are only for users to select. They aren't all used for payments
 * @param {dw.order.Basket}basket - the sfcc basket
 * @param {Object}boltPaymentMethods - payment methods from bolt account
 * @return {Object} res - if there are missing values in the input
 */
function addPaymentMethodInfoToBasket(basket, boltPaymentMethods) {
    var billingAddress;
    var boltBillingAddress;
    var boltPaymentMethod;
    var res = {};
    Transaction.wrap(function () {
        billingAddress = basket.getBillingAddress()
            ? basket.getBillingAddress() : basket.createBillingAddress();
    });

    boltPaymentMethods.forEach(function (paymentMethod) {
        // default payment method on bolt account can only be card at this point
        // but might change in the future
        // for embedded we only integrate with credit card payments
        if (paymentMethod.default === true
            && paymentMethod.type === constants.PAYMENT_METHOD_CARD) {
            boltBillingAddress = paymentMethod.billing_address;
            boltPaymentMethod = paymentMethod;
        }
    });

    if (!boltBillingAddress || !boltPaymentMethod) {
        log.warn('Payment method is missing from shopper details!');
        res.missingValue = true;
        return res;
    }

    // adding billing address to bolt account
    var addBillingAddressResult = addAccountDetailsToAddress(boltBillingAddress, billingAddress);
    if (addBillingAddressResult.missingValue) {
        log.warn('payment information - billing address is incomplete');
        res.missingValue = true;
    }
    // store all payment methods in the basket so that it can be later chosen by the customer
    Transaction.wrap(function () {
        // The maximum byte length of basket.custom property is 4000, so we only get the first 5 payment methods to avoid string value truncated
        basket.getCustom().boltPaymentMethods = JSON.stringify(boltPaymentMethods.length > 5 ? boltPaymentMethods.slice(0, 5) : boltPaymentMethods);
    });

    var creditCardNumber = boltPaymentMethod.last4 ? constants.CC_MASKED_DIGITS + boltPaymentMethod.last4 : '';
    var network = boltPaymentMethod.network || '';
    var expMonth = boltPaymentMethod.exp_month || '';
    var expYear = boltPaymentMethod.exp_year || '';
    var boltPaymentMethodID = boltPaymentMethod.id || '';

    Transaction.wrap(function () {
        var paymentInstruments = basket.getPaymentInstruments(
            constants.BOLT_PAY
        );
        collections.forEach(paymentInstruments, function (item) {
            basket.removePaymentInstrument(item);
        });

        // hard coding to BOLT_PAY as this is a bolt logged in shopper
        var paymentInstrument = basket.createPaymentInstrument(
            constants.BOLT_PAY,
            basket.totalGrossPrice
        );

        paymentInstrument.setCreditCardNumber(creditCardNumber);
        paymentInstrument.setCreditCardType(network);
        paymentInstrument.setCreditCardExpirationMonth(expMonth);
        paymentInstrument.setCreditCardExpirationYear(expYear);

        paymentInstrument.custom.boltPaymentMethodId = boltPaymentMethodID;
    });

    if (boltAccountUtils.checkEmptyValue([creditCardNumber, network, expMonth, expYear])) {
        log.warn('payment card information is incomplete');
        res.missingValue = true;
    }
    return res;
}

/**
 * Iterate each shipping address and billing address, if phone number value
 * is missing, preset it with phone number in profile.
 * @param {Object}shopperDetails - shopper details data from bolt
 */
function presetPhoneNumber(shopperDetails) {
    if (shopperDetails.profile.phone) {
        shopperDetails.addresses.forEach(function (address) {
            if (empty(address.phone_number)) {
                address.phone_number = shopperDetails.profile.phone;
            }
        });
        shopperDetails.payment_methods.forEach(function (paymentMethod) {
            if (!empty(paymentMethod.billing_address)
                && empty(paymentMethod.billing_address.phone_number)) {
                paymentMethod.billing_address.phone_number = shopperDetails.profile.phone;
            }
        });
    }
}

/**
 * Set fallback logout flag as true
 * @param {Object} res - sfcc request
 */
exports.setFallbackLogoutCookie = function (res) {
    var fallbackLogoutCookie = new Cookie('bolt_sfcc_session_logout', 'true');
    fallbackLogoutCookie.setMaxAge(31536000); // cookie will expire after 1 year
    fallbackLogoutCookie.setPath('/');
    res.base.addHttpCookie(fallbackLogoutCookie);
};

/**
 * remove fallback logout flag
 * @param {Object} res - sfcc request
 */
exports.removeFallbackLogoutCookie = function (res) {
    var fallbackLogoutCookie = new Cookie('bolt_sfcc_session_logout', '');
    fallbackLogoutCookie.setMaxAge(0); // 0 means delete the cookie
    res.base.addHttpCookie(fallbackLogoutCookie);
};

/**
 * Used for SSO login from checkout step
 * Create a new external authenticated account if no existing account and login the shopper to SFCC platform
 * @param {string} idToken - A JWT token issued when the request includes the scope open_id
 */
exports.loginOrCreatePlatformAccount = function (idToken) {
    var oauthConfiguration = OAuthUtils.getOAuthConfiguration();
    var clientID = oauthConfiguration.clientID;
    var boltAPIbaseURL = oauthConfiguration.boltAPIbaseURL;
    var providerID = oauthConfiguration.providerID;

    // validate OAuth ID token and get unique platform account ID
    var externalProfile = JWTUtils.parseAndValidateJWT(idToken, clientID, boltAPIbaseURL + constants.JWK_URL);
    if (!externalProfile) {
        return;
    }

    // create platform account for new shopper
    var createAccountResponse = OAuthUtils.createPlatformAccount(externalProfile, {}, {});
    if (createAccountResponse.error) {
        return;
    }
    var customerProfile = createAccountResponse.profile;

    // login SFCC account
    var platformAccountID = externalProfile.sub;
    var credentials = customerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(providerID, platformAccountID, false);
        });
    }
};
