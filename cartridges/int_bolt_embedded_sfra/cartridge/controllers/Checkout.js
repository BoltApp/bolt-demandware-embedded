'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var constants = require('~/cartridge/scripts/util/constants');

server.append('Begin', function (req, res, next) {
    var configuration = BoltPreferences.getSitePreferences();
    var basket = BasketMgr.getCurrentBasket();
    var boltStoredPaymentMethods = session.privacy.boltOauthToken ? JSON.parse(basket.custom.boltPaymentMethods) : null;
    var selectedPaymentInstrument = session.privacy.boltOauthToken ? basket.getPaymentInstruments(constants.BOLT_PAY)[0] : null;
    res.render('checkout/checkout', {
        config: configuration,
        boltStoredPaymentMethods: boltStoredPaymentMethods,
        selectedPaymentInstrument: selectedPaymentInstrument
    });
    next();
});
module.exports = server.exports();
