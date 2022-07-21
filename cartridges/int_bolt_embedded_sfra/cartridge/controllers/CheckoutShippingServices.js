'use strict';

/* API Includes */
var server = require('server');
var HttpResult = require('dw/svc/Result');
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var constants = require('~/cartridge/scripts/util/constants');
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
        var order = res.viewData.order;
        if (order.billing && empty(order.billing.matchingAddressId) && currentBasket.getDefaultShipment()) {
            order.billing.matchingAddressId = currentBasket.getDefaultShipment().UUID;
            order.billing.billingAddress = new AddressModel(currentBasket.getDefaultShipment().getShippingAddress());
            res.json({
                order: order
            });
        }
    });
    // shopper doesn't have a Bolt account or no stored address
    if (!boltAccountUtils.loginAsBoltUser() || empty(currentBasket.custom.boltShippingAddress)) {
        return next();
    }

    var shippingAddress = currentBasket.getDefaultShipment().getShippingAddress();
    var addressform = server.forms.getForm('shipping').shippingAddress.addressFields;
    var boltAddressId = addressform.boltAddressId.value;

    // save bolt address id to shipping address
    Transaction.wrap(function () {
        shippingAddress.custom.boltAddressId = boltAddressId || '';
    });

    next();
});
module.exports = server.exports();
