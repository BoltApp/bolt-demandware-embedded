'use strict';

// API Includes
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

// Script includes
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var log = LogUtils.getLogger('BoltAuthRequestBuilder');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('~/cartridge/scripts/util/constants');

/**
 * Build Auth request body
 * @param {dw.order.Order} order SFCC Order
 * @param {dw.order.PaymentInstrument} paymentInstrument SFCC Payment Instrument
 * @returns {Object | null} Auth request body object
 */
exports.build = function (order, paymentInstrument) {
    try {
        if (empty(paymentInstrument)) {
            return { error: true, errorMsg: 'Missing payment instrument.' };
        }

        if (empty(order.getBillingAddress())) {
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

        var request = {
            cart: buildCartField(order, paymentInstrument),
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

        // use saved Bolt payment for Auth
        if (boltAccountUtils.loginAsBoltUser() && paymentInstrument.custom.boltPaymentMethodId) {
            request.credit_card_id = paymentInstrument.custom.boltPaymentMethodId;
        } else { // use new credit card for Auth
            request.credit_card = buildCreditCardField(order, paymentInstrument);
        }
        return {
            authRequest: request,
            error: false
        };
    } catch (e) {
        var errorMessage = e.message + e.stack;
        log.error('Error occurred in auth request build function: ' + errorMessage);
        return {
            errorMsg: errorMessage,
            error: true
        };
    }
};

/**
 * Build credit card field
 * @param {dw.order.Order} order SFCC Order
 * @param {dw.order.PaymentInstrument} paymentInstrument SFCC Payment Instrument
 * @returns {Object | null} Credit card field object
 */
function buildCreditCardField(order, paymentInstrument) {
    var billingAddress = order.getBillingAddress();
    return {
        token: paymentInstrument.getCreditCardToken(),
        last4: paymentInstrument.getCreditCardNumberLastDigits(),
        bin: paymentInstrument.custom.boltCardBin,
        billing_address: buildBillingAddressField(order),
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

/**
 * Build cart details field
 * @param {dw.order.Order} order SFCC Order
 * @param {dw.order.PaymentInstrument} paymentInstrument SFCC Payment Instrument
 * @returns {Object | null} Bolt cart object or null if there is any error
 */
function buildCartField(order, paymentInstrument) {
    var taxAmount = Math.round(order.getTotalTax().getValue() * 100);
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    var amountInCent = Math.round(paymentTransaction.getAmount().getValue() * 100);
    var cart = {
        order_reference: order.getOrderNo(),
        total_amount: Math.round(amountInCent),
        tax_amount: taxAmount,
        currency: order.getCurrencyCode(),
        billing_address: buildBillingAddressField(order),
        in_store_cart_shipments: [],
        items: buildCarItemField(order),
        discounts: buildDiscountsField(order),
        shipments: buildShipmentsField(order),
        // metadata field is not used unless merchant is using old OCAPI
        // flow with "sfcc_embedded_skip_ocapi_fetch_order" gate
        // TODO (Alex P): Update this comment once gate removed
        metadata: {
            SFCCSessionID: getDwsidCookie()
        }
    };
    return cart;
}

/**
 * Build cart.shipment field
 * @param {dw.order.Order} order SFCC Order
 * @returns {Object} returns request's shipments
 */
function buildShipmentsField(order) {
    var shipmentsField = [];
    var shipments = order.getShipments();
    collections.forEach(shipments, function (shipment) {
        var shippingAddress = shipment.getShippingAddress();
        var shipmentField = {
            shipping_address: buildShippingAddressField(shippingAddress, order),
            cost: getShipmentCostInCents(shipment),
            service: shipment.getShippingMethod().getDisplayName()
        };
        shipmentsField.push(shipmentField);
    });

    return shipmentsField;
}

/**
 * Map SFCC shipping cost to bolt shipping cost,
 * we need to calculate the shipping cost without coupon price adjustment affected
 *
 * @param {dw.order.Shipment} shipment SFCC Product Line Item
 * @returns {number} indicate if the product type can be processed by bolt
 */
function getShipmentCostInCents(shipment) {
    var adjustedNetPrice = shipment.getAdjustedShippingTotalNetPrice().getValue();
    collections.forEach(shipment.getShippingPriceAdjustments(), function (priceAdjustment) {
        if (priceAdjustment.isBasedOnCoupon()) {
            adjustedNetPrice -= priceAdjustment.getPriceValue();
        }
    });
    return Math.round(adjustedNetPrice * 100);
}

/**
 * Build shipping address field
 * @param {dw.order.OrderAddress} shippingAddress address in Shipment object
 * @param {dw.order.Order} order SFCC Order
 * @returns {Object | null} new address object if existed
 */
function buildShippingAddressField(shippingAddress, order) {
    if (shippingAddress == null || boltAccountUtils.isEmptyAddress(shippingAddress)) {
        return null;
    }
    return {
        first_name: shippingAddress.getFirstName() || '',
        last_name: shippingAddress.getLastName() || '',
        email: order.getCustomerEmail() || '',
        phone: shippingAddress.getPhone() || '',
        street_address1: shippingAddress.getAddress1() || '',
        street_address2: shippingAddress.getAddress2() || '',
        company: shippingAddress.getCompanyName() || '',
        locality: shippingAddress.getCity() || '',
        region: shippingAddress.getStateCode() || '',
        postal_code: shippingAddress.getPostalCode() || '',
        country_code: shippingAddress.getCountryCode() ? shippingAddress.getCountryCode().getValue().toString().toUpperCase() : '',
        country: shippingAddress.getCountryCode() ? shippingAddress.getCountryCode().getDisplayValue() : ''
    };
}

/**
 * Returns billing address field
 *
 * @param {dw.order.Order} order SFCC Order
 * @returns {Object | null} new address object if existed
 */
function buildBillingAddressField(order) {
    var billingAddress = order.getBillingAddress();
    return {
        street_address1: billingAddress.getAddress1() || '',
        street_address2: billingAddress.getAddress2() || '',
        company: billingAddress.getCompanyName() || '',
        locality: billingAddress.getCity() || '',
        region: billingAddress.getStateCode() || '',
        postal_code: billingAddress.getPostalCode() || '',
        country_code: billingAddress.getCountryCode() ? billingAddress.getCountryCode().getValue().toString().toUpperCase() : '',
        country: billingAddress.getCountryCode() ? billingAddress.getCountryCode().getDisplayValue() : '',
        name: billingAddress.getFullName() || '',
        first_name: billingAddress.getFirstName() || '',
        last_name: billingAddress.getLastName() || '',
        phone_number: billingAddress.getPhone() || '',
        email: order.getCustomerEmail() || '',
        phone: billingAddress.getPhone() || ''
    };
}

/**
 * Build cart items field
 *
 * @param {dw.order.Order} order SFCC Order
 * @returns {Object | null} new address object if existed
 */
function buildCarItemField(order) {
    var cartItems = [];
    var productLineItems = order.getProductLineItems();

    collections.forEach(productLineItems, function (productLineItem) {
        var item;
        var totalAmount;
        var unitPrice;
        var quantity;
        totalAmount = getProductTotalPriceInCents(productLineItem);
        quantity = productLineItem.getQuantityValue();
        unitPrice = Math.round(totalAmount / quantity);
        item = {
            name: productLineItem.getProductName(),
            reference: productLineItem.getProductID(),
            quantity: quantity,
            type: 'physical',
            msrp: Math.round(productLineItem.getBasePrice().getValue() * 100),
            total_amount: totalAmount,
            unit_price: unitPrice
        };

        cartItems.push(item);
    });

    // GiftCertificate LineItems
    var giftCertificateLineItems = order.getGiftCertificateLineItems();
    collections.forEach(giftCertificateLineItems, function (giftCertificateLineItem) {
        var item = {
            name: 'Gift Certificate',
            reference: giftCertificateLineItem.getUUID(),
            total_amount: Math.round(giftCertificateLineItem.getNetPrice().getValue() * 100),
            unit_price: Math.round(giftCertificateLineItem.getPrice().getValue() * 100),
            quantity: 1,
            type: 'digital'
        };
        cartItems.push(item);
    });

    return cartItems;
}

/**
 * build discounts field
 *
 * @param {dw.order.Order} order SFCC Order
 * @returns {Object | null} new address object if existed
 */
function buildDiscountsField(order) {
    var discountsField = [];
    // Calculation for order level promotion
    collections.forEach(order.getPriceAdjustments(), function (priceAdjustment) {
        if (!priceAdjustment.isBasedOnCoupon()) {
            var discountAmount = Math.abs(priceAdjustment.getPriceValue());
            var discountAmountInCents = Math.round(discountAmount * 100);
            var description = priceAdjustment.getPromotionID();
            var promotion = priceAdjustment.getPromotion();
            if (promotion != null && 'cartMessage' in promotion.custom && promotion.custom.cartMessage != null) {
                description = promotion.custom.cartMessage;
            }
            var promotionField = {
                amount: discountAmountInCents,
                description: description || ''
            };
            discountsField.push(promotionField);
        }
    });
    // Calculation for coupon
    var couponLineItems = order.getCouponLineItems();
    collections.forEach(couponLineItems, function (couponLineItem) {
        if (!couponLineItem.isApplied()) {
            return;
        }
        var couponField;
        var couponCode = couponLineItem.getCouponCode();
        var CouponAmountInCents = calculateCouponAmountInCent(couponCode, order);
        couponField = {
            amount: CouponAmountInCents,
            description: 'Coupon (' + couponCode + ')',
            discount_category: 'coupon',
            discount_code: couponCode,
            reference: couponCode
        };
        discountsField.push(couponField);
    });
    // Calculation for Gift Cert Payment
    collections.forEach(order.getGiftCertificatePaymentInstruments(), function (gcPaymentInstr) {
        var giftPriceAdjustment = gcPaymentInstr.getPaymentTransaction().getAmount().getValue();
        if (giftPriceAdjustment > 0) {
            var maskedGiftCertificateCode = gcPaymentInstr.getMaskedGiftCertificateCode();
            var gc = {
                amount: Math.round(giftPriceAdjustment * 100),
                description: 'Gift Certificate (' + maskedGiftCertificateCode + ')',
                discount_category: 'giftcard',
                discount_code: maskedGiftCertificateCode,
                reference: maskedGiftCertificateCode
            };
            discountsField.push(gc);
        }
    });

    return discountsField;
}

/**
 * Calculate the sum of the price adjustments triggered by this coupon line item
 * @param {string} couponCode SFCC Order
 * @param {dw.order.Order} order SFCC Order
 * @returns {number} the sum of the price adjustments triggered by this coupon line item
 */
function calculateCouponAmountInCent(couponCode, order) {
    var couponAmount = 0;
    // check order level price adjustments
    collections.forEach(order.getPriceAdjustments(), function (priceAdjustment) {
        var couponLineItem = priceAdjustment.getCouponLineItem();
        if (couponLineItem != null && couponLineItem.getCouponCode() === couponCode) {
            couponAmount += priceAdjustment.getPriceValue();
        }
    });
    // check shipment level price adjustments
    collections.forEach(order.getShipments(), function (shipment) {
        collections.forEach(shipment.getShippingPriceAdjustments(), function (priceAdjustment) {
            var couponLineItem = priceAdjustment.getCouponLineItem();
            if (couponLineItem != null && couponLineItem.getCouponCode() === couponCode) {
                couponAmount += priceAdjustment.getPriceValue();
            }
        });
    });
    // check product level price adjustments
    collections.forEach(order.getProductLineItems(), function (productLineItem) {
        collections.forEach(productLineItem.getPriceAdjustments(), function (priceAdjustment) {
            var couponLineItem = priceAdjustment.getCouponLineItem();
            if (couponLineItem != null && couponLineItem.getCouponCode() === couponCode) {
                couponAmount += priceAdjustment.getPriceValue();
            }
        });
    });

    return Math.round(Math.abs(couponAmount) * 100);
}

/**
 * Get product total price, in order to map to bolt product price,
 * we need to calculate the item total without coupon price adjustment affected
 *
 * @param {dw.order.ProductLineItem} productLineItem SFCC Product Line Item
 * @returns {number} indicate if the product type can be processed by bolt
 */
function getProductTotalPriceInCents(productLineItem) {
    var totalPrice = productLineItem.getAdjustedNetPrice().getValue();
    collections.forEach(productLineItem.getPriceAdjustments(), function (priceAdjustment) {
        if (priceAdjustment.isBasedOnCoupon()) {
            // use subtraction because price value for price adjustment is negative
            totalPrice -= priceAdjustment.getPriceValue();
        }
    });

    var optionProductLineItemAmount = 0;
    var optionProductLineItems = productLineItem.getOptionProductLineItems();
    collections.forEach(optionProductLineItems, function (optionProductLineItem) {
        optionProductLineItemAmount += optionProductLineItem.getAdjustedNetPrice().getValue();
    });
    if (optionProductLineItemAmount > 0) {
        totalPrice += optionProductLineItemAmount;
    }
    return Math.round(totalPrice * 100);
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
