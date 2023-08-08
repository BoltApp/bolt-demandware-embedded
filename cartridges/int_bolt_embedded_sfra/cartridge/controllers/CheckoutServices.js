'use strict';

/* API Includes */
var server = require('server');

server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    if (!res.viewData.error) {
        // reset boltRedirectCheckout in the session, so Bolt can fill the checkout form automatically from shopper account data
        session.privacy.boltRedirectCheckout = true;
    }

    next();
});

module.exports = server.exports();
