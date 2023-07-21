'use strict';

// API Includes
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var HttpResult = require('dw/svc/Result');

// Script includes
var collections = require('*/cartridge/scripts/util/collections');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var oAuth = require('~/cartridge/scripts/services/oAuth');
var constants = require('~/cartridge/scripts/util/constants');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var boltPaymentUtils = require('~/cartridge/scripts/util/boltPaymentUtils');
var boltPayAuthRequestBuilder = require('~/cartridge/scripts/util/boltPayAuthRequestBuilder');
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

    // build auth request
    var authRequestObj = boltPayAuthRequestBuilder.build(order, paymentInstrument);
    if (authRequestObj.error) {
        log.error(authRequestObj.errorMsg);
        return { error: true, errorCode: '000000', errorMessage: authRequestObj.errorMsg };
    }

    // only attach oauth token if it is available and the user has not logged out
    var boltOAuthToken = oAuth.getOAuthToken();
    var bearerToken;
    if (!empty(boltOAuthToken) && !sessionLogoutCookieSet()) {
        bearerToken = 'Bearer '.concat(boltOAuthToken);
    }

    // Send auth call, note: saves both new address and new payment method.
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

    return { error: false };
}

/**
 * sessionLogoutCookieSet returns true if the bolt_sfcc_session_logout is set
 * @return {boolean} true if the cookie is set otherwise false
 */
function sessionLogoutCookieSet() {
    var cookies = request.getHttpCookies();

    for (var i = 0; i < cookies.cookieCount; i++) { // eslint-disable-line no-plusplus
        if (cookies[i].name === 'bolt_sfcc_session_logout') {
            return cookies[i].value === 'true';
        }
    }

    return false;
}

module.exports = {
    Handle: handle,
    Authorize: authorize
};
