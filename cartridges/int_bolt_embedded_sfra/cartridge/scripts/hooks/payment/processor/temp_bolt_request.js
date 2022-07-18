'use strict';

var Promotion = require('dw/campaign/Promotion');

var ArrayList = require('dw/util/ArrayList');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = LogUtils.getLogger('TempBoltRequest');

/**
 * Temporarily create Bolt cart from SFCC order for auth request
 * @param {dw.order.Order} order SFCC Order
 * @param {string} dwOrderID Demandware Order ID
 * @returns {Object} Bolt cart object
 */
exports.createBoltCart = function (order, dwOrderID) {
    var useShippingTotalPrice = false;

    var taxAmount = Math.round(order.getAdjustedMerchandizeTotalTax().value * 100);

    var cartTotalAmount = calculateCartTotalAmount(order);
    var cart = {
        order_reference: dwOrderID,
        total_amount: cartTotalAmount,
        tax_amount: taxAmount,
        currency: order.getCurrencyCode(),
        items: [],
        discounts: [],
        shipments: []
    };

    try {
        var productLineItems = order.getProductLineItems().toArray();
        var item;
        var priceByQuantity;
        var totalAmount;
        var optionProductPrice;

        for (var prodIdx = 0; prodIdx < productLineItems.length; prodIdx++) {
            var productLineItem = productLineItems[prodIdx];
            var optionProductLineItemAmount = 0;

            for (var option = 0; option < productLineItem.optionProductLineItems.length; option++) {
                var optionProductLineItem = productLineItem.optionProductLineItems[option];
                optionProductPrice = optionProductLineItem.adjustedPrice.value;
                optionProductLineItemAmount += optionProductPrice;
            }

            var adjustedPrice = calculateAdjustedPrice(productLineItem, optionProductLineItemAmount);
            priceByQuantity = adjustedPrice.priceByQuantity;
            totalAmount = adjustedPrice.totalAmount;
            item = {
                name: productLineItem.productName,
                reference: productLineItem.productID,
                total_amount: totalAmount,
                unit_price: optionProductLineItemAmount > 0 ? Math.round(priceByQuantity + optionProductLineItemAmount * 100) : Math.round(priceByQuantity),
                quantity: productLineItem.quantity.value,
                type: 'physical',
                image_url: getImageURL(productLineItem)
            };
            cart.items.push(item);
        } // GiftCertificate LineItems

        var giftCertificateLineItems = order.getGiftCertificateLineItems().toArray();

        for (var gl = 0; gl < giftCertificateLineItems.length; gl++) {
            var giftCertificateLineItem = giftCertificateLineItems[gl];
            var giftcertificateDetails = JSON.stringify({
                recipientEmail: giftCertificateLineItem.recipientEmail,
                recipientName: giftCertificateLineItem.recipientName,
                senderName: giftCertificateLineItem.senderName,
                message: giftCertificateLineItem.message
            });
            item = {
                name: giftCertificateLineItem.lineItemText,
                reference: giftCertificateLineItem.UUID,
                total_amount: Math.round(giftCertificateLineItem.grossPrice.value * 100),
                unit_price: Math.round(giftCertificateLineItem.price.value * 100),
                quantity: 1,
                type: 'digital',
                taxable: false,
                options: giftcertificateDetails
            };
            cart.items.push(item);
        } // Calculation for order level promotion

        var promoPriceAdjustments = order.getPriceAdjustments();

        if (!promoPriceAdjustments.empty) {
            for (var pa = 0; pa < promoPriceAdjustments.length; pa++) {
                var promo = promoPriceAdjustments[pa];

                if (promo.basedOnCoupon === false) {
                    var discountAmount = Math.abs(promo.basePrice ? promo.basePrice.value : 0);
                    var promoPriceAdjustment = Math.round(discountAmount * 100);
                    var promotion = {
                        amount: promoPriceAdjustment,
                        description: promo.promotion.name ? promo.promotion.name : promo.promotionID
                    };
                    cart.discounts.push(promotion);
                }
            }
        } // Calculation for coupon

        var couponLineItems = order.getCouponLineItems() ? order.getCouponLineItems().toArray() : [];
        var coupon;
        var couponAmount = 0;
        var promotionClasses = new ArrayList();

        for (var coupIdx = 0; coupIdx < couponLineItems.length; coupIdx++) {
            couponAmount = 0;
            var couponLineItem = couponLineItems[coupIdx];

            if (couponLineItem) {
                for (var coupIndex = 0; coupIndex < couponLineItem.priceAdjustments.length; coupIndex++) {
                    var couponPriceAdjustment = couponLineItem.priceAdjustments[coupIndex];
                    var discountPrice = couponPriceAdjustment.basePrice ? couponPriceAdjustment.basePrice.value : 0;
                    promotionClasses.add(couponPriceAdjustment.getPromotion().getPromotionClass());
                    couponAmount += Math.abs(discountPrice);
                }
            }

            for (var classIdx = 0; classIdx < promotionClasses.length; classIdx++) {
                var promotionClass = promotionClasses[classIdx];

                if (promotionClass.equals(Promotion.PROMOTION_CLASS_SHIPPING) && couponAmount > 0) {
                    useShippingTotalPrice = true;
                }
            }

            if (couponAmount > 0) {
                coupon = {
                    amount: Math.round(couponAmount * 100),
                    description: 'Coupon (' + couponLineItem.couponCode + ')',
                    discount_category: 'coupon',
                    discount_code: couponLineItem.couponCode,
                    reference: couponLineItem.couponCode
                };
                cart.discounts.push(coupon);
            }
        } // Gift Certificate amount calculation

        var gcPaymentInstruments = order.getGiftCertificatePaymentInstruments() ? order.getGiftCertificatePaymentInstruments().toArray() : [];
        var giftCertAmount;

        for (var gcIdx = 0; gcIdx < gcPaymentInstruments.length; gcIdx++) {
            var gcPaymentInstr = gcPaymentInstruments[gcIdx];

            if (gcPaymentInstr) {
                var giftPriceAdjustment = gcPaymentInstr.paymentTransaction ? gcPaymentInstr.paymentTransaction.amount.value : 0;
                giftCertAmount = Math.round(giftPriceAdjustment * 100);
            }

            if (giftCertAmount > 0) {
                var gc = {
                    amount: giftCertAmount,
                    description: 'Gift Certificate (' + gcPaymentInstr.maskedGiftCertificateCode + ')',
                    discount_category: 'giftcard',
                    discount_code: gcPaymentInstr.giftCertificateCode,
                    reference: gcPaymentInstr.giftCertificateCode
                };
                cart.discounts.push(gc);
            }

            if (cartTotalAmount !== 0) {
                cart.total_amount -= giftCertAmount;
            }
        }

        if (order.allShippingPriceAdjustments.length > 0) {
            var requestShipment = prepareRequestShipment(order, useShippingTotalPrice);
            cart.shipments = requestShipment.shipments;
            cart.total_amount += requestShipment.totalShippingAmount;
        }
    } catch (e) {
        log.error('Exception occurred (requestBoltOrder): ' + e.message);
    }

    return cart;
};

/**
 * Calculate entire cart total
 * @param {Object} basket - current basket
 * @returns {number} total amount
 */
function calculateCartTotalAmount(basket) {
    var totalAmount = 0;
    var gcPaymentInstruments = basket.getGiftCertificatePaymentInstruments();
    var adjustedTotalNetPriceInDollars = basket.getAdjustedMerchandizeTotalNetPrice().value * 100;
    var adjustedTotalTaxInDollars = basket.getAdjustedMerchandizeTotalTax().value * 100;

    if (gcPaymentInstruments.length !== 0) {
        var productPrice = basket.getAdjustedMerchandizeTotalGrossPrice().value;
        var giftCertAmount = 0;

        for (var gc = 0; gc < gcPaymentInstruments.length; gc++) {
            var gcPaymentInstr = gcPaymentInstruments[gc];

            if (gcPaymentInstr) {
                var giftPriceAdjustment = gcPaymentInstr.paymentTransaction ? gcPaymentInstr.paymentTransaction.amount.value : 0;
                giftCertAmount += giftPriceAdjustment;
            }
        }

        if (giftCertAmount > productPrice) {
            totalAmount = 0;
        } else {
            totalAmount = Math.round(adjustedTotalNetPriceInDollars + adjustedTotalTaxInDollars);
        }
    } else {
        totalAmount = Math.round(adjustedTotalNetPriceInDollars + adjustedTotalTaxInDollars);
    }

    if (basket.getGiftCertificateLineItems().length !== 0) {
        totalAmount += Math.round(basket.giftCertificateTotalGrossPrice.value * 100);
    }

    return totalAmount;
}

/**
 * Calculates the price by quantity and total amount given product line item
 * @param {dw.order.ProductLineItem} productLineItem - product line item
 * @param {number} optionProductLineItemAmount option product amount
 * @returns {Object} the price by quantity and total amount
 */
function calculateAdjustedPrice(productLineItem, optionProductLineItemAmount) {
    var adjustedNetPriceInDollars = productLineItem.adjustedNetPrice.value * 100;
    var optionAmountInDollars = optionProductLineItemAmount * 100;
    var result = {
        priceByQuantity: adjustedNetPriceInDollars / productLineItem.quantity.value,
        totalAmount: Math.round(adjustedNetPriceInDollars + optionAmountInDollars)
    };
    var basedOnCoupon = false;

    for (var paIdx = 0; paIdx < productLineItem.priceAdjustments.length; paIdx++) {
        var priceAdjustment = productLineItem.priceAdjustments[paIdx];
        basedOnCoupon = basedOnCoupon || priceAdjustment.basedOnCoupon;
    }

    if (basedOnCoupon === true) {
        var netPriceInDollars = productLineItem.getNetPrice().value * 100;
        result.priceByQuantity = netPriceInDollars / productLineItem.quantity.value;
        result.totalAmount = Math.round(netPriceInDollars + optionAmountInDollars);
    }

    return result;
}

/**
 * Prepare request's shipment field
 * @param {Object} basket - current basket object
 * @param {boolean} useShippingTotalPrice whether or not to use shipping total price
 * @returns {Object} returns request's shipments and total shipping amount
 */
function prepareRequestShipment(basket, useShippingTotalPrice) {
    var cartShipments = basket.getShipments();

    if (!cartShipments) {
        return {
            shipments: [],
            totalShippingAmount: 0
        };
    }

    var shipments = [];
    var totalShippingAmount = 0;
    var cartShippingMethod;
    var shippingAddress = {};
    var shipment;

    for (var cartShipIdx = 0; cartShipIdx < cartShipments.length; cartShipIdx++) {
        var cartShipment = cartShipments[cartShipIdx];
        var newShippingAddress = cartShipment.getShippingAddress();
        shippingAddress = updateAddress(newShippingAddress, basket.getCustomerEmail()) || shippingAddress;
        var shippingPrice = useShippingTotalPrice ? cartShipment.getShippingTotalPrice().value * 100 : cartShipment.getAdjustedShippingTotalPrice().value * 100;
        var decimalValue = shippingPrice.toFixed(2);
        var shippingCost = new Number(decimalValue);
        shipment = {
            shipping_address: shippingAddress,
            cost: shippingCost,
            tax_amount: 0.0
        };
        totalShippingAmount += cartShipment.getAdjustedShippingTotalPrice().value * 100 + cartShipment.getAdjustedShippingTotalTax().value * 100;
        cartShippingMethod = cartShipment.getShippingMethod();

        if (cartShippingMethod) {
            shipment.service = cartShippingMethod.displayName;
        }

        shipments.push(shipment);
    }

    return {
        shipments: shipments,
        totalShippingAmount: totalShippingAmount
    };
}

/**
 * Returns the new address request object
 * @param {dw.order.OrderAddress} newAddress address in Shipment object
 * @param {string} customerEmail customer's email
 * @returns {Object | null} new address object if existed
 */
function updateAddress(newAddress, customerEmail) {
    if (!newAddress) {
        return null;
    }

    var countryCode = newAddress.countryCode;
    return {
        first_name: newAddress.firstName || '',
        last_name: newAddress.lastName || '',
        email: customerEmail || '',
        phone: newAddress.phone || '',
        street_address1: newAddress.address1 || '',
        street_address2: newAddress.address2 || '',
        locality: newAddress.city || '',
        region: newAddress.stateCode || '',
        postal_code: newAddress.postalCode || '',
        country_code: countryCode ? countryCode.displayValue.toUpperCase() : '',
        country: countryCode ? countryCode.displayValue : ''
    };
}

/**
 * Returns the image URL of product
 *
 * @param {dw.order.ProductLineItem} productLineItem - product line item
 * @returns {string | null} image URL if exists, null otherwise
 */
function getImageURL(productLineItem) {
    var product = productLineItem.getProduct();
    var imageSizes = ['small', 'large'];

    for (var i = 0; i < imageSizes.length; i++) {
        if (product.getImage(imageSizes[i], 0)) {
            return product.getImage(imageSizes[i], 0).absURL.toString();
        }
    }

    return null;
}
