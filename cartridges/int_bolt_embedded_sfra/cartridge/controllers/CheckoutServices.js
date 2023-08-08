'use strict';

/* API Includes */
var server = require('server');

// Script includes
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('CheckoutService');

server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    if (!res.viewData.error) {
        // reset boltRedirectCheckout in the session, so Bolt can fill the checkout form automatically from shopper account data
        session.privacy.boltRedirectCheckout = true;
    }

    next();
});

module.exports = server.exports();
