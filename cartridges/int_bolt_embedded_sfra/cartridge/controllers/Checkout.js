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
    res.render('checkout/checkout', {
        config: configuration,
        boltStoredPaymentMethods: boltStoredPaymentMethods,
    });
    next();
});
module.exports = server.exports();
