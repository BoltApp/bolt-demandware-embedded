"use strict";

// API Includes
var Resource = require("dw/web/Resource");
var Transaction = require("dw/system/Transaction");
var OrderMgr = require("dw/order/OrderMgr");
var BasketMgr = require("dw/order/BasketMgr");
var StringUtils = require("dw/util/StringUtils");
var Site = require("dw/system/Site");
var HttpResult = require("dw/svc/Result");

// Script includes
var collections = require("*/cartridge/scripts/util/collections");
var boltHttpUtils = require("~/cartridge/scripts/services/httpUtils");
var constants = require("~/cartridge/scripts/util/constants");
var logUtils = require("~/cartridge/scripts/util/boltLogUtils");
var log = logUtils.getLogger("Auth");

/**
 * Verify credit card information and create a payment instrument.
 * @param {dw.order.Basket} currentBasket - current basket
 * @param {Object} paymentInformation - object with payment information
 * @param {String} paymentMethodID - current payment method id
 * @param {Object} req - request
 * @returns {Object}
 */
function handle(currentBasket, paymentInformation, paymentMethodID, req) {
  if (!paymentInformation.creditCardToken) {
    return {
      fieldErrors: {},
      serverErrors: [
        Resource.msg("error.card.information.error", "creditCard", null),
      ],
      error: true,
    };
  }

  Transaction.wrap(function () {
    var paymentInstruments = currentBasket.getPaymentInstruments(
      constants.BOLT_PAY
    );
    collections.forEach(paymentInstruments, function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    var paymentInstrument = currentBasket.createPaymentInstrument(
      paymentMethodID,
      currentBasket.totalGrossPrice
    );
    paymentInstrument.setCreditCardNumber(
      constants.CC_MASKED_DIGITS + paymentInformation.lastFourDigits
    );
    paymentInstrument.setCreditCardType(paymentInformation.cardType);
    paymentInstrument.setCreditCardExpirationMonth(
      paymentInformation.expirationMonth
    );
    paymentInstrument.setCreditCardExpirationYear(
      paymentInformation.expirationYear
    );
    paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
  });

  return { fieldErrors: {}, serverErrors: [], error: false };
}

/**
 * Send authorize request to Bolt
 * @param {String} orderNumber - order number
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  payment processor of current payment method
 * @return {Object} returns an response object
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor) {
  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
  });

  // build auth request
  var order = OrderMgr.getOrder(orderNumber);
  var authRequestObj = getAuthRequest(order, paymentInstrument);
  if (authRequestObj.error) {
    log.error(authRequestObj.errorMsg);
  }

  // send auth call
  var response = boltHttpUtils.restAPIClient(
    constants.HTTP_METHOD_POST,
    constants.AUTH_CARD_URL,
    JSON.stringify(authRequestObj.authRequest)
  );
  if (response.status && response.status === HttpResult.ERROR) {
    log.error(
      "Payment authorization failed, error: " +
        (!empty(response.errors) && !empty(response.errors[0].message)
          ? response.errors[0].message
          : "")
    );
    return { error: true };
  }

  // set payment transaction
  Transaction.wrap(function () {
    var transactionRef =
      response.transaction && response.transaction.reference
        ? response.transaction.reference
        : orderNumber;
    paymentInstrument.getPaymentTransaction().setTransactionID(transactionRef);
  });

  return { error: false };
}

function getAuthRequest(order, paymentInstrument) {
  if (empty(paymentInstrument)) {
    return { error: true, errorMsg: "Missing payment instrument." };
  }

  if (empty(paymentInstrument.custom.basketId)) {
    return { error: true, errorMsg: "SFCC basket ID not found." };
  }

  var creditCardInfo = {
    token: paymentInstrument.getCreditCardToken(),
    last4: paymentInstrument.custom.boltCardLastDigits,
    bin: paymentInstrument.custom.boltCardBin,
    number: "",
    expiration:
      StringUtils.formatNumber(
        paymentInstrument.getCreditCardExpirationYear(),
        "0000"
      ) +
      "-" +
      StringUtils.formatNumber(
        paymentInstrument.getCreditCardExpirationMonth(),
        "00"
      ),
    postal_code: order.getBillingAddress().getPostalCode(),
    token_type: constants.BOLT_TOKEN_TYPE,
  };

  var userIdentifier = {
    email: order.getCustomerEmail(),
    phone: order.getBillingAddress().getPhone(),
  };
  var userIdentity = {
    first_name: order.getBillingAddress().getFirstName(),
    last_name: order.getBillingAddress().getLastName(),
  };

  var request = {
    basketId: paymentInstrument.custom.basketId,
    credit_card: creditCardInfo,
    division_id:
      Site.getCurrent().getCustomPreferenceValue("boltMerchantDivisionID") ||
      "",
    source: constants.DIRECT_PAYMENTS,
    user_identifier: userIdentifier,
    user_identity: userIdentity,
    create_bolt_account: paymentInstrument.custom.boltCreateAccount,
  };

  return {
    authRequest: request,
    error: false,
  };
}

module.exports = {
  Handle: handle,
  Authorize: authorize,
};
