"use strict";

var server = require('server');

var page = module.superModule;
server.extend(page);
/* Script Modules */

var BoltPreferences = require('~/cartridge/scripts/util/preferences');

server.append('Begin', function (req, res, next) {
  var configuration = BoltPreferences.getSitePreferences();
  res.render('checkout/checkout', {
    config: configuration,
  });
  next();
});
module.exports = server.exports();