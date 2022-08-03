'use strict';

/* API Includes */
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Shipping');
var AddressModel = require('*/cartridge/models/address');

server.extend(module.superModule);

/**
 * Set billing address data with default shipping address if no billing matching address id is set. Save Bolt shippping address id.
 */
server.append('SubmitShipping', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        try {
            var order = res.viewData.order;
            if (order && currentBasket) {
                var emptyBillingAddressInBasket = boltAccountUtils.isEmptyAddress(currentBasket.getBillingAddress());
                var noBillingAddressData = empty(order.billing.matchingAddressId) && emptyBillingAddressInBasket;
                if (noBillingAddressData && order.billing && currentBasket.getDefaultShipment()) {
                    order.billing.matchingAddressId = currentBasket.getDefaultShipment().UUID;
                    order.billing.billingAddress = new AddressModel(currentBasket.getDefaultShipment().getShippingAddress());
                    res.json({
                        order: order
                    });
                }
            }
        } catch (e) {
            log.error(e.message);
        }
    });
    // shopper doesn't have a Bolt account or no stored address
    if (!boltAccountUtils.loginAsBoltUser() || empty(currentBasket.custom.boltShippingAddress)) {
        log.info('shopper has no bolt stored address, cannot save bolt address ID');
        return next();
    }

    var shippingAddress = currentBasket.getDefaultShipment().getShippingAddress();
    var addressform = server.forms.getForm('shipping').shippingAddress.addressFields;
    var boltAddressId = addressform.boltAddressId.value;

    // save bolt address id to shipping address
    Transaction.wrap(function () {
        shippingAddress.custom.boltAddressId = boltAddressId || '';
    });

    return next();
});
module.exports = server.exports();
