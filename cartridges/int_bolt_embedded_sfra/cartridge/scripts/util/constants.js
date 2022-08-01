'use strict';

/**
 * Endpoint Constants
 */

exports.AUTH_CARD_URL = '/v1/merchant/transactions/authorize';
exports.CHECK_ACCOUNT_EXIST_URL = '/v1/account/exists?email=';
exports.OAUTH_TOKEN_URL = '/v1/oauth/token';
exports.ACCOUNT_DETAILS_URL = '/v1/account';
exports.SHOPPER_ADDRESS_URL = '/v1/account/addresses';
exports.ADD_PAYMENT_URL = '/v1/account/payment_methods';

/**
 * Payment Method
 */
exports.BOLT_PAY = 'BOLT_PAY';
exports.DIRECT_PAYMENTS = 'direct_payments';
exports.BOLT_TOKEN_TYPE = 'bolt';
exports.CC_MASKED_DIGITS = '************';
exports.PAYMENT_METHOD_CARD = 'card';

/**
 * Cartridge Version
 */
exports.BOLT_SOURCE_NAME = 'commerce_cloud';
exports.BOLT_CARTRIDGE_VERSION = '22.7.1';

/**
 * HTTP Method
 */
exports.HTTP_METHOD_POST = 'POST';

/**
 * Time to Refresh Oauth Token in Milliseconds
 * 4000 -> 4 seconds
 */
exports.OAUTH_TOKEN_REFRESH_TIME = 4000;
