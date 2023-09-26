'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/* API Includes */
var ProductMgr = require('dw/catalog/ProductMgr');
/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/helpers/preferences');

server.append('Show', function (req, res, next) {
    var params = req.querystring;
    var product = ProductMgr.getProduct(params.pid);
    if (product != null) {
        var displayPPCButton = true;
        if ('hideBoltButtonPDP' in product.custom && product.custom.hideBoltButtonPDP == true) {
            displayPPCButton = false;
        }
        var configuration = BoltPreferences.getSitePreferences();

        // Check if product is available in the inventory.
        // need to check if the avaibility logic applies to all product types
        var productAvailable = false;
        var availablityModel = product.getAvailabilityModel();
        if (availablityModel && availablityModel.isInStock()) {
            productAvailable = true;
        }

        var renderBoltPPCButton = configuration.boltEnablePPC && productAvailable && displayPPCButton;
        res.setViewData({
            config: configuration,
            renderBoltPPCButton: renderBoltPPCButton
        });
    }
    next();
});

module.exports = server.exports();
