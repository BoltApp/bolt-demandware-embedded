var BasketMgr = require('dw/order/BasketMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');

var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('~/cartridge/scripts/util/constants');
var log = LogUtils.getLogger('CheckAccount');

/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {Object} shopperDetails - shopper's profile
 * @returns {Object} result
 */
exports.addAccountDetailsToBasket = function(shopperDetails){
    log.info("Shopper Info to add to basket", shopperDetails);
    const basket = BasketMgr.getCurrentBasket();

    // set shopper detail to shipping address
    let boltDefaultAddress;
    shopperDetails.addresses.forEach(function(address){
        if (address.default === true) {
            boltDefaultAddress = address;
        }
    });

    if (shopperDetails.addresses) {
        var shopperAddresses = JSON.stringify(shopperDetails.addresses);
        Transaction.wrap(function (){
            basket.custom.boltShippingAddress = shopperAddresses;
        })
    }

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

        addAccountDetailsToAddress(boltDefaultAddress, shippingAddress);
    });

    // adding payment methods to the baskek's custom field
    addPaymentMethodInfoToBasket(basket, shopperDetails.payment_methods)

    // set email to the basket
    Transaction.wrap(function (){
        basket.setCustomerEmail(shopperDetails.profile.email);
    })
}


/**
 * Adding the account details to the address on basket
 * @param boltAddress - address from bolt account
 * @param address - address on the basket
 */
function addAccountDetailsToAddress(boltAddress, address){
    try{
        Transaction.wrap(function () {
            address.setPhone(boltAddress.phone_number);
            address.setFirstName(boltAddress.first_name);
            address.setLastName(boltAddress.last_name);
            address.setAddress1(boltAddress.street_address1);
            address.setCity(boltAddress.locality);
            address.setStateCode(boltAddress.region_code);
            address.setCountryCode(boltAddress.country_code);
            address.setPostalCode(boltAddress.postal_code);
        });
    } catch(e){
        log.error(e.message);
    }
}

/**
 * Adding the payment information from bolt account to basket, as a string
 * We can't create payment instruments on the baskets as the payment methods
 * from the bolt account are only for users to select. They aren't all used for payments
 * @param basket - the sfcc basket
 * @param boltPaymentMethods - payment methods from bolt account
 */
function addPaymentMethodInfoToBasket(basket, boltPaymentMethods){
    let billingAddress, boltBillingAddress, boltPaymentMethod;
    Transaction.wrap(function (){
        billingAddress = basket.getBillingAddress() ? basket.getBillingAddress() : basket.createBillingAddress();
    })

    boltPaymentMethods.forEach(function(paymentMethod){
        if (paymentMethod.default === true) {
            boltBillingAddress = paymentMethod.billing_address;
            boltPaymentMethod = paymentMethod;
        }
    });

    // adding billing address to bolt account
    addAccountDetailsToAddress(boltBillingAddress, billingAddress);

    // store all payment methods in the basket so that it can be later chosen by the customer
    Transaction.wrap(function(){
        basket.getCustom().boltPaymentMethods = JSON.stringify(boltPaymentMethods)
    });

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
        paymentInstrument.setCreditCardNumber(
            constants.CC_MASKED_DIGITS + boltPaymentMethod.last4
        );
        paymentInstrument.setCreditCardType(boltPaymentMethod.network);
        paymentInstrument.setCreditCardExpirationMonth(
            boltPaymentMethod.exp_month
        );
        paymentInstrument.setCreditCardExpirationYear(
            boltPaymentMethod.exp_year
        );

        paymentInstrument.custom.basketId = basket.UUID;
        // TODO: don't have this info at this point, do we need to add it later
        //paymentInstrument.custom.boltCardBin = paymentInformation.bin;
        paymentInstrument.custom.boltPaymentMethodId = boltPaymentMethod.id;
    });


}
