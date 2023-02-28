'use strict';

// API Includes
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var HttpResult = require('dw/svc/Result');

// Script includes
var collections = require('*/cartridge/scripts/util/collections');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var oAuth = require('~/cartridge/scripts/services/oAuth');
var constants = require('~/cartridge/scripts/util/constants');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var boltPaymentUtils = require('~/cartridge/scripts/util/boltPaymentUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Auth');

/**
 * Verify credit card information and create a payment instrument.
 * @param {dw.order.Basket} currentBasket - current basket
 * @param {Object} paymentInformation - object with payment information
 * @param {string} paymentMethodID - current payment method id
 * @param {Object} req - request
 * @returns {Object} JSON Object
 */
function handle(
    currentBasket,
    paymentInformation,
    paymentMethodID,
    req // eslint-disable-line no-unused-vars
) {
    var useCreditCardToken = !empty(paymentInformation.creditCardToken);
    var useExistingCard = boltAccountUtils.loginAsBoltUser()
        && !empty(paymentInformation.selectedBoltPaymentID);
    if (!useCreditCardToken && !useExistingCard) {
        return {
            fieldErrors: {},
            serverErrors: [
                Resource.msg('payment.info.missing.error', 'bolt', null)
            ],
            error: true
        };
    }
    var paymentInstrument;
    // reset bolt related payment instrument
    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(constants.BOLT_PAY);
        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });
        var gcTotal = boltPaymentUtils.getGiftCertificatesAmount(currentBasket);
        var nonGCTotal = currentBasket.totalGrossPrice.subtract(gcTotal);
        paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodID, nonGCTotal);
    });

    if (useExistingCard) {
        var selectedPaymentID = paymentInformation.selectedBoltPaymentID;
        var selectedBoltPayment = boltAccountUtils.getBoltPayment(currentBasket, selectedPaymentID);
        if (selectedBoltPayment === null) {
            return {
                fieldErrors: {},
                serverErrors: [
                    Resource.msg('payment.info.missing.error', 'bolt', null)
                ],
                error: true
            };
        }
        Transaction.wrap(function () {
            paymentInstrument.setCreditCardNumber(
                constants.CC_MASKED_DIGITS + selectedBoltPayment.last4
            );
            paymentInstrument.setCreditCardType(selectedBoltPayment.network);
            paymentInstrument.setCreditCardExpirationMonth(selectedBoltPayment.exp_month);
            paymentInstrument.setCreditCardExpirationYear(selectedBoltPayment.exp_year);
            paymentInstrument.custom.boltPaymentMethodId = selectedPaymentID;
        });
    } else {
        Transaction.wrap(function () {
            paymentInstrument.setCreditCardNumber(
                constants.CC_MASKED_DIGITS + paymentInformation.lastFourDigits
            );
            paymentInstrument.setCreditCardType(paymentInformation.cardType);
            paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth);
            paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear);
            paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
            paymentInstrument.custom.boltCardBin = paymentInformation.bin;
            paymentInstrument.custom.boltTokenType = paymentInformation.token_type;
            paymentInstrument.custom.boltCreateAccount = paymentInformation.createAccount;
        });
    }

    return { fieldErrors: {}, serverErrors: [], error: false };
}

/**
 * Send authorize request to Bolt
 * @param {string} orderNumber - order number
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -
 *         payment processor of the current payment method
 * @return {Object} returns an response object
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor) {
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
    });
    var order = OrderMgr.getOrder(orderNumber);
    // save card to bolt account
    // if save card is success, use the new credit card id for authorization
    if (boltAccountUtils.loginAsBoltUser() && !empty(paymentInstrument.getCreditCardToken())) {
        var saveCardResult = boltAccountUtils.saveCardToBolt(order, paymentInstrument);
        if (saveCardResult.success) {
            Transaction.wrap(function () {
                paymentInstrument.custom.boltPaymentMethodId = saveCardResult.newPaymentMethodID;
            });
        }
    }

    // build auth request
    var authRequestObj = getAuthRequest(order, paymentInstrument);
    if (authRequestObj.error) {
        log.error(authRequestObj.errorMsg);
    }

    // only attach oauth token if it is available and the user has not logged out
    var boltOAuthToken = oAuth.getOAuthToken();
    var bearerToken;
    if (!empty(boltOAuthToken)) {
        bearerToken = 'Bearer '.concat(boltOAuthToken);
    }

    // send auth call
    var response = boltHttpUtils.restAPIClient(
        constants.HTTP_METHOD_POST,
        constants.AUTH_CARD_URL,
        JSON.stringify(authRequestObj.authRequest),
        constants.CONTENT_TYPE_JSON,
        bearerToken
    );
    if (response.status && response.status === HttpResult.ERROR) {
        var errorMessage = !empty(response.errors) && !empty(response.errors[0].message)
            ? response.errors[0].message
            : '';
        var errorCode = !empty(response.errors) && !empty(response.errors[0].code)
            ? response.errors[0].code
            : '';
        log.error('Payment authorization failed, error: ' + errorMessage + ' ; Code: ' + errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    // set payment transaction
    Transaction.wrap(function () {
        order.custom.boltTransactionReference = response.result.transaction && response.result.transaction.reference ? response.result.transaction.reference : '';
        paymentInstrument.getPaymentTransaction().setTransactionID(orderNumber);
    });

    // save shipping address to bolt account
    if (boltAccountUtils.loginAsBoltUser()) {
        boltAccountUtils.saveAddressToBolt(order);
    }

    return { error: false };
}

/**
 * Create Authorization Request Body
 * @param {dw.order.Order} order - SFCC order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument to authorize
 * @return {Object} returns an response object
 */
function getAuthRequest(order, paymentInstrument) {
    if (empty(paymentInstrument)) {
        return { error: true, errorMsg: 'Missing payment instrument.' };
    }

    if (empty(order.billingAddress)) {
        return { error: true, errorMsg: 'SFCC basket has not billing address.' };
    }

    var billingAddress = order.getBillingAddress();
    var userIdentifier = {
        email: order.getCustomerEmail(),
        phone: billingAddress.getPhone()
    };
    var userIdentity = {
        first_name: billingAddress.getFirstName(),
        last_name: billingAddress.getLastName()
    };

    var boltBillingAddress = {
        street_address1: billingAddress.getAddress1() || '',
        street_address2: billingAddress.getAddress2() || '',
        locality: billingAddress.getCity() || '',
        region: billingAddress.getStateCode() || '',
        postal_code: billingAddress.getPostalCode() || '',
        country_code: billingAddress.getCountryCode() ? billingAddress.getCountryCode().getValue().toUpperCase() : '',
        country: billingAddress.getCountryCode() ? billingAddress.getCountryCode().getDisplayValue() : '',
        name: billingAddress.getFullName(),
        first_name: billingAddress.getFirstName(),
        last_name: billingAddress.getLastName(),
        phone_number: billingAddress.getPhone(),
        email: order.getCustomerEmail(),
        phone: billingAddress.getPhone() || ''
    };

    var request = {
        cart: {
            order_reference: order.getOrderNo(),
            billing_address: boltBillingAddress,
            currency: order.currencyCode,
            metadata: {
                SFCCSessionID: getDwsidCookie()
            }
        },
        division_id:
            Site.getCurrent().getCustomPreferenceValue('boltMerchantDivisionID') || '',
        source: constants.DIRECT_PAYMENTS,
        user_identifier: userIdentifier,
        user_identity: userIdentity,
        create_bolt_account: paymentInstrument.custom.boltCreateAccount
    };

    // populate auto capture field if needed
    var autoCapture = Site.getCurrent().getCustomPreferenceValue('boltEnableAutoCapture') === true;
    if (autoCapture) {
        request.auto_capture = true;
    }

    // use Bolt payment ID for Bolt
    if (boltAccountUtils.loginAsBoltUser() && paymentInstrument.custom.boltPaymentMethodId) {
        request.credit_card_id = paymentInstrument.custom.boltPaymentMethodId;
    } else {
        request.credit_card = {
            token: paymentInstrument.getCreditCardToken(),
            last4: paymentInstrument.getCreditCardNumberLastDigits(),
            bin: paymentInstrument.custom.boltCardBin,
            billing_address: boltBillingAddress,
            number: '',
            expiration:
        StringUtils.formatNumber(
            paymentInstrument.getCreditCardExpirationYear(),
            '0000'
        )
        + '-'
        + StringUtils.formatNumber(
            paymentInstrument.getCreditCardExpirationMonth(),
            '00'
        ),
            postal_code: billingAddress.getPostalCode(),
            token_type: constants.BOLT_TOKEN_TYPE
        };
    }

    return {
        authRequest: request,
        error: false
    };
}

/**
 * getDwsidCookie returns DW Session ID from cookie
 * @return {string} DW Session ID
 */
function getDwsidCookie() {
    var cookies = request.getHttpCookies();

    for (var i = 0; i < cookies.cookieCount; i++) { // eslint-disable-line no-plusplus
        if (cookies[i].name === 'dwsid') {
            return cookies[i].value;
        }
    }

    return '';
}

module.exports = {
    Handle: handle,
    Authorize: authorize
};
