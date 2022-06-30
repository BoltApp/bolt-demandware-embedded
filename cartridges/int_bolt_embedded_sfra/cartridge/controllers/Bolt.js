"use strict";

var HttpResult = require('dw/svc/Result');
var server = require('server');
/* API Includes */

var LogUtils = require('~/cartridge/scripts/utils/boltLogUtils');
var log = LogUtils.getLogger('CheckAccount');
var httpUtils = require('~/cartridge/scripts/services/httpUtils')


server.get('accountExists', server.middleware.https, function (req, res, next) {
    var email = req.querystring.email;
    var response = httpUtils.restAPIClient('GET', '/account/exists?email=' + email);

    var returnObject = {};
    if(response.status == HttpResult.OK) {
        returnObject.hasBoltAccount = response.result.has_bolt_account;
    } else {
        returnObject.hasBoltAccount = false;
        returnObject.errorMessage = response.errors;
    }

    res.json(returnObject);
    next();
});

module.exports = server.exports();