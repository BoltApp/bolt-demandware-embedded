'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');

server.append('Begin', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    var basket = BasketMgr.getCurrentBasket();
    var boltStoredPaymentMethods = boltAccountUtils.loginAsBoltUser() ? JSON.parse(basket.custom.boltPaymentMethods) : null;
    var boltStoredShippingAddress = boltAccountUtils.loginAsBoltUser() && basket.custom.boltShippingAddress ? JSON.parse(basket.custom.boltShippingAddress) : null;
    var boltAddressId = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() ? basket.getDefaultShipment().getShippingAddress().custom.boltAddressId : "";
    res.render('checkout/checkout', {
        config: configuration,
        boltStoredPaymentMethods: boltStoredPaymentMethods,
        boltStoredShippingAddress: boltStoredShippingAddress,
        boltAddressId: boltAddressId
    });
    next();
});
module.exports = server.exports();
