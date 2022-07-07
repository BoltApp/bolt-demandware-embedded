/**
 * Endpoint Constants
 */

exports.AUTH_CARD_URL = "/v1/merchant/transactions/authorize";
exports.CHECK_ACCOUNT_EXIST_URL = "/v1/account/exists?email=";
exports.OAUTH_TOKEN_URL = "/v1/oauth/token";
exports.ACCOUNT_DETAILS_URL = "/v1/account";

/**
 * Payment Method
 */
exports.BOLT_PAY = "BOLT_PAY";
exports.DIRECT_PAYMENTS = "direct_payments";
exports.BOLT_TOKEN_TYPE = "bolt";
exports.CC_MASKED_DIGITS = "************";

/**
 * Cartridge Version
 */
exports.BOLT_SOURCE_NAME = "commerce_cloud";
exports.BOLT_CARTRIDGE_VERSION = "21.4.22";

/**
 * HTTP Method
 */
exports.HTTP_METHOD_POST = "POST";

/**
 * Shipping methods
 */
exports.DEFAULT_SHIPPING_METHOD_ID = "me";
