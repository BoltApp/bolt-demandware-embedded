'use strict';

/* API Includes */
var server = require('server');
var Site = require('dw/system/Site');
// Script includes
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('CheckoutService');

server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    if (!res.viewData.error) {
        if (Site.getCurrent().getCustomPreferenceValue('boltEnableSSO')) {
            // reset boltRedirectCheckout in the session, so Bolt can fill the checkout form automatically from shopper account data
            session.privacy.boltRedirectCheckout = true;
        } else {
            // clear session data after order placed successfully
            log.info('clearing session data after a successful order!');
            boltAccountUtils.clearBoltSessionData();
        }
    }
    next();
});

module.exports = server.exports();
