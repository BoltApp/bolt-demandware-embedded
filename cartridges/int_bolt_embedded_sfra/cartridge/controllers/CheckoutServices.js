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
        // clear session data after order placed successfully
        log.info('clearing session data after a successful order!');
        boltAccountUtils.clearBoltSessionData();
    }

    next();
});

module.exports = server.exports();
