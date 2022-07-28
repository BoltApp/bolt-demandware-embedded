'use strict';

/* API Includes */
var server = require('server');

// Script includes
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');

server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    if (!res.viewData.error) {
        // clear session data after order placed successfully
        boltAccountUtils.clearBoltSessionData();
    }

    next();
});

module.exports = server.exports();
