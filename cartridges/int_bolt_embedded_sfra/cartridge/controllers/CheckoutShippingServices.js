'use strict';

/* API Includes */
var server = require('server');
var HttpResult = require("dw/svc/Result");
var Resource = require('dw/web/Resource');

/* Script Modules */
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var boltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var constants = require('~/cartridge/scripts/util/constants');
var logUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = logUtils.getLogger('Shipping');

server.extend(module.superModule);

/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {returns} - json
 */
server.prepend('SubmitShipping', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var form = server.forms.getForm('shipping');

    // shopper doesn't have a Bolt account or save address to Bolt checkbox is not checked
    if (!session.privacy.isAuthenticatedboltShopper || !form.saveToBolt) {
        return next();
    }
    
    // TO DO: use edit address endpoint for selected existing address
    var request = {
        street_address1: form.shippingAddress.addressFields.address1.value || "",
        street_address2: form.shippingAddress.addressFields.address2.value || "",
        locality: form.shippingAddress.addressFields.city.value || "",
        region: form.shippingAddress.addressFields.states.stateCode.value || "",
        postal_code: form.shippingAddress.addressFields.postalCode.value || "",
        country_code: form.shippingAddress.addressFields.country.value || "",
        first_name: form.shippingAddress.addressFields.firstName.value || "",
        last_name: form.shippingAddress.addressFields.lastName.value || "",
        phone: form.shippingAddress.addressFields.phone.value || ""
    }
    var bearerToken = "Bearer ".concat(session.privacy.boltOauthToken);

    // send save address request to Bolt
    var response = boltHttpUtils.restAPIClient(constants.HTTP_METHOD_POST, constants.SHOPPER_ADDRESS_URL, JSON.stringify(request), '', bearerToken);
    if (response.status && response.status === HttpResult.ERROR) {
        let errorMsg = Resource.msg('error.save.address', 'bolt', null)
        log.error(errorMsg + (!empty(response.errors) && !empty(response.errors[0].message) ? response.errors[0].message : "") );
        res.json({
            error: true,
            fieldErrors: [],
            serverErrors: [errorMsg]
        });
    }

    return next();
});


module.exports = server.exports();
