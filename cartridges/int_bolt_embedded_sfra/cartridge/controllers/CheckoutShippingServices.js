'use strict';

/* API Includes */
var server = require('server');
var HttpResult = require("dw/svc/Result");
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var boltAccountUtils = require('~/cartridge/scripts/util/boltAccountUtils');
var constants = require('~/cartridge/scripts/util/constants');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Shipping');
var AddressModel = require('*/cartridge/models/address');

server.extend(module.superModule);

/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {returns} - json
 */
server.prepend('SubmitShipping', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    // shopper doesn't have a Bolt account
    if (!boltAccountUtils.loginAsBoltUser()) {
        return next();
    }

    var addressform = server.forms.getForm('shipping').shippingAddress.addressFields;
    var currentBasket = BasketMgr.getCurrentBasket();
    var shippingAddress = currentBasket.getDefaultShipment().getShippingAddress();
    var boltAddressId = addressform.boltAddressId.value;

    Transaction.wrap(function () {
        shippingAddress.custom.boltAddressId = boltAddressId || "";
    });

    // skip Bolt address update if checkbox is not checked
    if (!addressform.saveToBolt.checked) {
        return next();
    }

    var addressUrl = constants.SHOPPER_ADDRESS_URL;
    // edit stored Bolt address
    if (boltAddressId) {
        addressUrl += "/" + boltAddressId;
    }

    var request = {
        street_address1: addressform.address1.value || "",
        street_address2: addressform.address2.value || "",
        locality: addressform.city.value || "",
        region: addressform.states.stateCode.value || "",
        postal_code: addressform.postalCode.value || "",
        country_code: addressform.country.value || "",
        first_name: addressform.firstName.value || "",
        last_name: addressform.lastName.value || "",
        phone: addressform.phone.value || ""
    }
    var bearerToken = "Bearer ".concat(session.privacy.boltOauthToken);

    // send save address request to Bolt
    var response = boltHttpUtils.restAPIClient(constants.HTTP_METHOD_POST, addressUrl, JSON.stringify(request), '', bearerToken);
    var errorMsg = Resource.msg('error.save.address', 'bolt', null)
    if (response.status && response.status === HttpResult.ERROR) {
        log.error(errorMsg + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : "") );
        res.json({
            error: true,
            fieldErrors: [],
            serverErrors: [errorMsg]
        });
    } else {
        var rs = boltAccountUtils.updateBasketBoltaddress(boltAddressId, response.result)
        if (rs.error) {
            res.json({
                error: true,
                fieldErrors: [],
                serverErrors: [rs.errorMsg || errorMsg]
            });
        }
    }
 
    return next();
});

/**
 * Set billing address data with default shipping address if no
 * billing matching address id is set.
 */
server.append('SubmitShipping', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var currentBasket = BasketMgr.getCurrentBasket();
        var order = res.viewData.order;
        if (order.billing && empty(order.billing.matchingAddressId) && currentBasket.getDefaultShipment()) {
            order.billing.matchingAddressId = currentBasket.getDefaultShipment().UUID;
            order.billing.billingAddress = new AddressModel(currentBasket.getDefaultShipment().getShippingAddress());
            res.json({
                order: order
            });
        }
    });
    next();
});
module.exports = server.exports();
