'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var Locale = require('dw/util/Locale');
var PaymentMgr = require('dw/order/PaymentMgr');
var URLUtils = require('dw/web/URLUtils');
var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Checkout');
var AddressModel = require('*/cartridge/models/address');
var constants = require('~/cartridge/scripts/util/constants');

server.append('Begin', function (req, res, next) {
    var configuration, boltStoredPaymentMethods, boltStoredShippingAddress, boltAddressId, boltPayLogo;
    var shippingAddressDataMissing = true;
    var basket = BasketMgr.getCurrentBasket();
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var order = res.viewData.order;
        if (order.billing && empty(order.billing.matchingAddressId) && basket.getDefaultShipment()) {
            order.billing.matchingAddressId = basket.getDefaultShipment().UUID;
            order.billing.billingAddress = new AddressModel(basket.getDefaultShipment().getShippingAddress());
        }
    });
    try {
        configuration = BoltPreferences.getSitePreferences();
        boltStoredPaymentMethods = boltAccountUtils.loginAsBoltUser() ? JSON.parse(basket.custom.boltPaymentMethods) : null;
        boltStoredShippingAddress = boltAccountUtils.loginAsBoltUser() && basket.custom.boltShippingAddress ? JSON.parse(basket.custom.boltShippingAddress) : null;
        boltAddressId = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() ? basket.getDefaultShipment().getShippingAddress().custom.boltAddressId : '';
        if (basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress()) {
            shippingAddressDataMissing = boltAccountUtils.isAnyAddressDataMissing(basket.getDefaultShipment().getShippingAddress());
        }

        var boltPayment = PaymentMgr.getPaymentMethod(constants.BOLT_PAY);
        if(boltPayment.getImage() !== null){
            boltPayLogo = boltPayment.getImage().getHttpsURL();
        }else{
            boltPayLogo = URLUtils.staticURL('/images/credit.png');
        }
    } catch (e) {
        log.error(e.message);
        res.json({
            error: true
        });
        return next();
    }
    res.render('checkout/checkout', {
        isBoltShopperLoggedIn: boltAccountUtils.loginAsBoltUser(),
        boltPayLogo: boltPayLogo,
        config: configuration,
        boltStoredPaymentMethods: boltStoredPaymentMethods,
        boltStoredShippingAddress: boltStoredShippingAddress,
        boltAddressId: boltAddressId,
        shippingAddressDataMissing: shippingAddressDataMissing,
        locale: req.locale.id
    });
    next();
});
module.exports = server.exports();
