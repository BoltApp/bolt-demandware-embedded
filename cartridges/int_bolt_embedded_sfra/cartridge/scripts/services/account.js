var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var collections = require('*/cartridge/scripts/util/collections');
var log = LogUtils.getLogger('CheckAccount');

/**
 * This returns the JSON encoded result for the return value of token exchange endpoint
 * @param {Object} shopperDetails - shopper's profile
 * @returns {Object} result
 */
exports.addAccountDetailsToBasket = function(shopperDetails){
    const basket = BasketMgr.getCurrentBasket();

    let boltDefaultAddress;
    // set customer address to basket
    for (var address in shopperDetails.addresses){
        if (address.default === true) {
            boltDefaultAddress = address;
            break;
        }
    }
    // set shopper detail to shipping address
    collections.forEach(basket.getShipments(), function (shipment) {
        // TODO: skip email delivery if there is any
        addAccountDetailsToAddress(boltDefaultAddress, shipment.getShippingAddress());
    });

    //const billingAddress = basket.getBillingAddress() ? basket.getBillingAddress() : basket.createBillingAddress();
    const billingAddress = basket.getBillingAddress()
    let boltBillingAddress;
    for (var paymentMethod in shopperDetails.payment_methods){
        if (paymentMethod.default === true) {
            boltBillingAddress = paymentMethod.billingAddress;
            break;
        }
    }

    // adding billing address to bolt account
    addAccountDetailsToAddress(boltBillingAddress, billingAddress);

    // adding payment methods to the baskek's custom field
    addPaymentMethodInfoToBasket(basket, shopperDetails.payment_methods)
}


/**
 * Adding the account details to the address on basket
 * @param boltAddress - address from bolt account
 * @param address - address on the basket
 */
function addAccountDetailsToAddress(boltAddress, address){
    try{
        Transaction.wrap(function () {
            // set customer profile to basket
            address.setEmail(boltAddress.email);
            address.setPhone(boltAddress.phone);
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
    Transaction.wrap(function(){
        basket.getCustom().boltPaymentMethods = JSON.stringify(boltPaymentMethods)
    });
}
