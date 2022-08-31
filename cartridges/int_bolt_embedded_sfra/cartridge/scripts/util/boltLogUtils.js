'use strict';

// API Includes
var Logger = require('dw/system/Logger');
var LogPrefix = 'bolt';

exports.getLogger = function (category) {
    if (category) {
        return Logger.getLogger(LogPrefix, category);
    }

    return Logger.getLogger(LogPrefix);
};
/**
 * Mask customer's sensitive data
 * @param {Object} data - request object
 * @returns {Object} masked data
 */
exports.maskCustomerData = function (data) {
    var maskedData = JSON.stringify(data);
    maskedData = actionMaskData(JSON.parse(maskedData));
    return JSON.stringify(maskedData);
};

/**
 * Mask customer's sensitive data
 * @param {Object} obj - request object
 * @returns {Object} masked data
 */
function actionMaskData(obj) {
    // eslint-disable-next-line
    for (var key in obj) {
        switch (key) {
            case 'first_name':
            case 'last_name':
            case 'name':
            case 'expiration':
            case 'billing_address':
            case 'shipping_address':
            case 'phone':
            case 'email':
                obj[key] = '***';
                break;
            default:
                if (typeof obj[key] === 'object') {
                    obj[key] = actionMaskData(obj[key]);
                }
                break;
        }
    }
    return obj;
}
