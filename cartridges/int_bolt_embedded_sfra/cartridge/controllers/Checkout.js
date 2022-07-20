'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Checkout');

server.append('Begin', function (req, res, next) {
    var configuration, basket, boltStoredPaymentMethods, boltStoredShippingAddress, boltAddressId;
    try {
        configuration = BoltPreferences.getSitePreferences();
        basket = BasketMgr.getCurrentBasket();
        boltStoredPaymentMethods = boltAccountUtils.loginAsBoltUser() ? JSON.parse(basket.custom.boltPaymentMethods) : null;
        boltStoredShippingAddress = boltAccountUtils.loginAsBoltUser() && basket.custom.boltShippingAddress ? JSON.parse(basket.custom.boltShippingAddress) : null;
        boltAddressId = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() ? basket.getDefaultShipment().getShippingAddress().custom.boltAddressId : '';
    } catch (e) {
        log.error(e.message);
        res.json({
            error: true
        });
        return next();
    }

    res.render('checkout/checkout', {
        config: configuration,
        boltStoredPaymentMethods: boltStoredPaymentMethods,
        boltStoredShippingAddress: boltStoredShippingAddress,
        boltAddressId: boltAddressId,
        locale: req.locale.id
    });
    next();
});
module.exports = server.exports();
