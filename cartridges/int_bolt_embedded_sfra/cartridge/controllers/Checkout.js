'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var HttpResult = require('dw/svc/Result');

var page = module.superModule;
server.extend(page);

/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Checkout');
var AddressModel = require('*/cartridge/models/address');
var constants = require('~/cartridge/scripts/util/constants');
var httpUtils = require('~/cartridge/scripts/services/httpUtils');
var account = require('~/cartridge/scripts/services/account');
var oAuth = require('~/cartridge/scripts/services/oAuth');

server.append('Begin', function (req, res, next) {
    var configuration;
    var boltStoredPaymentMethods;
    var boltStoredShippingAddress;
    var boltAddressId;
    var boltPayLogo;
    var shippingAddressDataMissing = true;
    var basket = BasketMgr.getCurrentBasket();

    if (basket.custom && basket.custom.boltEmbeddedAccountsTokens) {
        var oauthToken = JSON.parse(basket.custom.boltEmbeddedAccountsTokens);
        Transaction.wrap(function () {
            basket.custom.boltEmbeddedAccountsTokens = null;
        });
        if ((oauthToken.bolt_token_expires_in - new Date().getTime()) > constants.OAUTH_TOKEN_REFRESH_TIME) {
            session.privacy.boltOAuthToken = oauthToken.access_token;
            session.privacy.boltRefreshToken = oauthToken.refresh_token;
            session.privacy.boltRefreshTokenScope = oauthToken.refresh_token_scope;
            session.privacy.boltOAuthTokenExpire = oauthToken.bolt_token_expires_in;
            session.privacy.boltRedirectCheckout = true;
        }
    }

    var boltOAuthToken = oAuth.getOAuthToken();
    if (!empty(boltOAuthToken) && session.privacy.boltRedirectCheckout) {
        session.privacy.boltRedirectCheckout = false;
        var bearerToken = 'Bearer '.concat(boltOAuthToken);
        var response = httpUtils.restAPIClient(constants.HTTP_METHOD_GET, constants.ACCOUNT_DETAILS_URL, null, '', bearerToken);
        if (response.status === HttpResult.OK) {
            var shopperDetails = response.result;
            var addAccountDetailsResult = account.addAccountDetailsToBasket(shopperDetails);
            if (addAccountDetailsResult.redirectShipping) {
                res.redirect(URLUtils.https('Checkout-Begin').append('stage', 'shipping').toString());
            } else if (addAccountDetailsResult.redirectBilling) {
                res.redirect(URLUtils.https('Checkout-Begin').append('stage', 'payment').toString());
            } else {
                res.redirect(URLUtils.https('Checkout-Begin').append('stage', 'placeOrder').toString());
            }
        }
    }

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var order = res.viewData.order;
        if (order.billing
            && empty(order.billing.matchingAddressId)
            && basket.getDefaultShipment()) {
            order.billing.matchingAddressId = basket.getDefaultShipment().UUID;
            order.billing.billingAddress = new AddressModel(
                basket.getDefaultShipment().getShippingAddress()
            );
        }
    });
    try {
        configuration = BoltPreferences.getSitePreferences();
        boltStoredPaymentMethods = boltAccountUtils.loginAsBoltUser()
            ? JSON.parse(basket.custom.boltPaymentMethods) : null;
        boltStoredShippingAddress = boltAccountUtils.loginAsBoltUser()
            && basket.custom.boltShippingAddress
            ? JSON.parse(basket.custom.boltShippingAddress) : null;
        boltAddressId = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() && !empty(basket.getDefaultShipment().getShippingAddress().custom.boltAddressId) ? basket.getDefaultShipment().getShippingAddress().custom.boltAddressId : '';
        if (basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress()) {
            shippingAddressDataMissing = boltAccountUtils.isAnyAddressDataMissing(
                basket.getDefaultShipment().getShippingAddress()
            );
        }

        var boltPayment = PaymentMgr.getPaymentMethod(constants.BOLT_PAY);
        if (boltPayment.getImage() !== null) {
            boltPayLogo = boltPayment.getImage().getHttpsURL();
        } else {
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
    return next();
});
module.exports = server.exports();
