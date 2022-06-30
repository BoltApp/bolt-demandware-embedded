"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
var Logger = require('dw/system/Logger');
var LogPrefix = 'bolt';

exports.getLogger = function (category) {
  if (category) {
    return Logger.getLogger(LogPrefix, category);
  }

  return Logger.getLogger(LogPrefix);
};
/**
 * Mask customer's sensitive data, interaction function
 * @param {Object} data - request object
 * @returns {Object} masked data
 */


exports.maskCustomerData = function (data) {
  var maskedData = JSON.stringify(data);
  maskedData = actionMaskData(JSON.parse(maskedData));
  return JSON.stringify(maskedData);
};
/**
 * Mask customer's sensitive data - action function
 * @param {Object} obj - request object
 * @returns {Object} masked data
 */


function actionMaskData(obj) {
  // eslint-disable-next-line
  for (var key in obj) {
    switch (key) {
      case 'first_name':
      case 'last_name':
      case 'expiration':
      case 'billing_address':
      case 'shipping_address':
      case 'phones':
      case 'emails':
        obj[key] = '***'; // eslint-disable-line no-param-reassign

        if (_typeof(obj[key]) === 'object') {
          actionMaskData(obj[key]);
        }

        break;

      default:
        break;
    }
  }

  return obj;
}