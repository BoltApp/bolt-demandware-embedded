var BasketMgr = require('dw/order/BasketMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');

var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('~/cartridge/scripts/util/constants');
var log = LogUtils.getLogger('CheckAccount');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');

/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {Object} shopperDetails - shopper's profile
 * @returns {Object} result - if we need to redirect to shipping & billing page when there are missing values
 */
exports.addAccountDetailsToBasket = function(shopperDetails){
    var res = {};
    try {
        log.info("Shopper Info to add to basket {0}", shopperDetails);
        const basket = BasketMgr.getCurrentBasket();

        // set shopper detail to shipping address
        let boltDefaultAddress;
        shopperDetails.addresses.forEach(function(address){
            if (address.default === true) {
                boltDefaultAddress = address;
            }
        });

        // save bolt shipping addresses in basket
        if (shopperDetails.addresses) {
            var shopperAddresses = JSON.stringify(shopperDetails.addresses);
            Transaction.wrap(function (){
                basket.custom.boltShippingAddress = shopperAddresses;
            })
        }

        if (boltDefaultAddress){
            collections.forEach(basket.getShipments(), function (shipment) {
                // TODO: skip email delivery if there is any
                if(!shipment.getShippingAddress()){
                    Transaction.wrap(function (){
                        shipment.createShippingAddress();
                    })
                }
                if(!shipment.getShippingMethod()){
                    Transaction.wrap(function (){
                        shipment.setShippingMethod(ShippingMgr.getDefaultShippingMethod());
                    })
                }

                // save Bolt address ID to shipping address
                var shippingAddress = shipment.getShippingAddress();
                Transaction.wrap(function (){
                    shippingAddress.custom.boltAddressId = boltDefaultAddress.id;
                });

                const addAddressResult = addAccountDetailsToAddress(boltDefaultAddress, shippingAddress);
                if (addAddressResult.missingValue){
                    res.redirectShipping = true;
                }
            });
        } else {
            log.warn("default shipping address is missing from shopper details!");
            res.redirectShipping = true;
        }

        // adding payment methods to the baskek's custom field
        const addPaymentResult = addPaymentMethodInfoToBasket(basket, shopperDetails.payment_methods);

        // hacky fix for missing phone number in the billing address
        // note: there could be email only account so we need to check if there is a phone number for this account
        if(!basket.getBillingAddress().getPhone() && shopperDetails.profile.phone){
            Transaction.wrap(function (){
                basket.getBillingAddress().setPhone(shopperDetails.profile.phone);
            })
        }

        if(addPaymentResult.missingValue){
            res.redirectBilling = true;
        }

        // set email to the basket
        Transaction.wrap(function (){
            basket.setCustomerEmail(shopperDetails.profile.email);
        }) 
    } catch (e) {
        log.error(e.message);
    }

    return res;
}


/**
 * Adding the account details to the address on basket
 * @param boltAddress - address from bolt account
 * @param address - address on the basket
 * @return res - if there are missing values in the input
 */
function addAccountDetailsToAddress(boltAddress, address){
    var phone = boltAddress.phone_number || '';
    var first_name = boltAddress.first_name || '';
    var last_name = boltAddress.last_name || '';
    var address1 = boltAddress.street_address1 || '';
    var city = boltAddress.locality || '';
    var state_code = boltAddress.region_code || '';
    var country_code = boltAddress.country_code || '';
    var postal_code = boltAddress.postal_code || '';
    Transaction.wrap(function () {
        address.setPhone(phone);
        address.setFirstName(first_name);
        address.setLastName(last_name);
        address.setAddress1(address1);
        address.setCity(city);
        address.setStateCode(state_code);
        address.setCountryCode(country_code);
        address.setPostalCode(postal_code);
    });
    if (boltAccountUtils.checkEmptyValue([phone, first_name, last_name, address1, city, state_code, country_code, postal_code])){
        log.warn('address information incomplete');
        return {
            missingValue: true
        }
    }
    return {
        missingValue: false
    }
}

/**
 * Adding the payment information from bolt account to basket, as a string
 * We can't create payment instruments on the baskets as the payment methods
 * from the bolt account are only for users to select. They aren't all used for payments
 * @param basket - the sfcc basket
 * @param boltPaymentMethods - payment methods from bolt account
 * @return res - if there are missing values in the input
 */
function addPaymentMethodInfoToBasket(basket, boltPaymentMethods){
    let billingAddress, boltBillingAddress, boltPaymentMethod;
    let res = {};
    Transaction.wrap(function (){
        billingAddress = basket.getBillingAddress() ? basket.getBillingAddress() : basket.createBillingAddress();
    })

    boltPaymentMethods.forEach(function(paymentMethod){
        // default payment method on bolt account can only be card at this point but might change in the future
        // for embedded we only integrate with credit card payments
        if (paymentMethod.default === true && paymentMethod.type === constants.PAYMENT_METHOD_CARD) {
            boltBillingAddress = paymentMethod.billing_address;
            boltPaymentMethod = paymentMethod;
        }
    });

    if (!boltBillingAddress || !boltPaymentMethod){
        log.warn("Payment method is missing from shopper details!");
        res.missingValue = true;
        return res;
    }

    // adding billing address to bolt account
    var addBillingAddressResult = addAccountDetailsToAddress(boltBillingAddress, billingAddress);
    if (addBillingAddressResult.missingValue){
        log.warn("payment information - billing address is incomplete");
        res.missingValue = true;
    }
    // store all payment methods in the basket so that it can be later chosen by the customer
    Transaction.wrap(function(){
        basket.getCustom().boltPaymentMethods = JSON.stringify(boltPaymentMethods)
    });

    var creditCardNumber = boltPaymentMethod.last4 ? constants.CC_MASKED_DIGITS + boltPaymentMethod.last4 : '';
    var network = boltPaymentMethod.network || '';
    var exp_month = boltPaymentMethod.exp_month || '';
    var exp_year = boltPaymentMethod.exp_year || '';
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
        paymentInstrument.setCreditCardExpirationMonth(exp_month);
        paymentInstrument.setCreditCardExpirationYear(exp_year);

        // TODO: don't have this info at this point, do we need to add it later
        //paymentInstrument.custom.boltCardBin = paymentInformation.bin;
        paymentInstrument.custom.boltPaymentMethodId = boltPaymentMethodID;
    });

    if(boltAccountUtils.checkEmptyValue([creditCardNumber, network, exp_month, exp_year])){
        log.warn("payment card information is incomplete");
        res.missingValue = true;
    }
    return res;
}