'use strict';

/* API Includes */
var Bytes = require('dw/util/Bytes');
var Encode = require('dw/crypto/Encoding');
var Signature = require('dw/crypto/Signature');
var HttpResult = require('dw/svc/Result');
/* Script Modules */
var BoltPreferences = require('~/cartridge/scripts/util/preferences');
var BoltHttpUtils = require('~/cartridge/scripts/services/httpUtils');
var LogUtils = require('~/cartridge/scripts/util/boltLogUtils');
var log = LogUtils.getLogger('JWTUtils');

/**
 * Reference document: https://auth0.com/docs/tokens/json-web-tokens/validate-json-web-tokens#manually-implement-checks
 * @param {string} token - the JWT token
 * @param {string} audience - the token audience
 * @param {string} jwksUrl - the pubkey to verify the token signature
 * @returns {Object} result - object in JWT token body, return null if parse failed
 */
exports.parseAndValidateJWT = function (token, audience, jwksUrl) {
    // 1. Check JWT is well-formed
    // 1.1 contains three parts and separated by dot
    var parts = token.split('.');
    if (parts.length !== 3) {
        log.error('JWT token malformed: ' + token);
        return null;
    }
    var encodedHeader = parts[0];
    var encodedPayload = parts[1];
    var encodedSignature = parts[2];

    // 1.2 decode header
    var headerByte = Encode.fromBase64(encodedHeader);
    var headerStr = headerByte.toString();
    var header = JSON.parse(headerStr);

    // 1.3 decode payload
    var payloadByte = Encode.fromBase64(encodedPayload);
    var payloadStr = payloadByte.toString();
    var payload = JSON.parse(payloadStr);

    // 2. Check standard claims
    // 2.1 make sure the expiration time must be after the current time
    var exp = payload.exp;
    var timestamp = new Date().getTime();
    if (timestamp > exp * 1000) {
        log.error('JWT token expired: ' + token);
        return null;
    }

    // 2.2 issuing authority should be bolt
    var iss = payload.iss;
    if (iss !== 'https://bolt.com' && iss !== BoltPreferences.getBoltApiServiceURL()) {
        log.error('Invalid issuing authority: ' + token);
        return null;
    }

    // 2.3 audience should be
    var aud = payload.aud;
    if (aud.indexOf(audience) === -1) {
        log.error('Missing client id as audience: ' + token);
        return null;
    }

    // 3. Check signature
    // 3.1 check allowed algorithm, Bolt uses RSA-SHA256
    var alg = header.alg;
    if (alg !== 'RS256') {
        log.error('Signature algorithm not support, only RS256 is supported: ' + token);
        return null;
    }

    // 3.2 get Bolt RSA public key
    var pubkey = getBoltPublicKey(jwksUrl, header.kid);
    if (!pubkey) {
        log.error('Unable to parse pubkey from jwksUrl: ' + jwksUrl);
        return null;
    }

    // 3.3 compare hashed value
    var signature = new Signature();
    var contentToVerify = encodedHeader + '.' + encodedPayload;
    var contentToVerifyBytes = new Bytes(contentToVerify);
    var encodedContentToVerify = Encode.toBase64(contentToVerifyBytes);
    var success = signature.verifySignature(encodedSignature, encodedContentToVerify, pubkey, 'SHA256withRSA');
    if (!success) {
        log.error('Signature verification failed: ' + token);
        return null;
    }

    // 4. Check fields exist
    if (!payload.sub) {
        log.error("Missing 'sub' field in the payload");
        return null;
    }

    return payload;
};

/**
 * Fetch the JWKs from given URL and given key id
 * @param {string} url - the JWKs url
 * @param {string} kid - the id of the key that should be used in the JWKs file
 * @returns {string} public key - Bolt public key
 */
function getBoltPublicKey(url, kid) {
    var serviceResponse = BoltHttpUtils.restAPIClient('GET', '', '', '', '', url);
    if (!serviceResponse || serviceResponse.status == HttpResult.ERROR || !serviceResponse.result || !serviceResponse.result.keys) {
        log.error('Fetch Bolt JWKs file failed with URL: ' + url);
        return null;
    }

    var keys = serviceResponse.result.keys;
    for (var i = 0; i < keys.length; i++) {
        var jwk = keys[i];
        if (jwk.kid === kid) {
            return encodePublicKeyToPemFromJWK(jwk);
        }
    }

    log.error('Unable to find kid: ' + kid + ' in provided url: ' + url);
    return null;
}

/**
 * Encode the given JWK to PEM format
 * Note: for now the algorithm will only support RSA-4096
 * @param {string} jwk - the JWKs object
 * @returns {string} public key - public key parsed from JWKs
 */
function encodePublicKeyToPemFromJWK(jwk) {
    if (jwk.kty !== 'RSA') {
        log.error('Unsupported key type in jwk. Expected "RSA" as kty but found: ' + jwk.kty);
    }

    /*
      Base64 URL encoded values to Base64 encoded
      Document: https://en.wikipedia.org/wiki/Base64#The_URL_applications
      - replace '_' to '/'
      - replace '-' to '+'
    */
    var modulusBase64 = jwk.n.replace(/_/g, '/').replace(/-/g, '+');
    var exponentBase64 = jwk.e.replace(/_/g, '/').replace(/-/g, '+');
    var modulusHex = Encode.toHex(Encode.fromBase64(modulusBase64));
    var exponentHex = Encode.toHex(Encode.fromBase64(exponentBase64));

    /*
      ASN.1 Encode to PEM (format)
      Read more: https://docs.microsoft.com/en-us/windows/win32/seccertenroll/about-der-encoding-of-asn-1-types

      Encoded with TLV (Tag Length Value)
      Tag:
      0x02  INTEGER
      0x03  BIT STRING
      0x05  NULL
      0x06  OBJECT IDENTIFIER
      0x30  SEQUENCE

      Code to be encoded:
      SEQUENCE  {
          algorithm  ::=  SEQUENCE  {
              algorithm               OBJECT IDENTIFIER, -- 1.2.840.113549.1.1.1 rsaEncryption (PKCS#1 1)
              parameters              ANY DEFINED BY algorithm OPTIONAL  },
          subjectPublicKey     BIT STRING {
              RSAPublicKey ::= SEQUENCE {
                  modulus            INTEGER,    -- n
                  publicExponent     INTEGER     -- e
              }
          }
      }

      Convert Code to hex representation:
      30 82 02 22          ;SEQUENCE (0x222 bytes = 546 bytes)
      |  30 0D             ;SEQUENCE (0x0d bytes = 13 bytes)
      |  |  06 09          ;OBJECT IDENTIFIER (0x09 = 9 bytes)
      |  |  2A 86 48 86
      |  |  F7 0D 01 01 01 ;hex encoding of 1.2.840.113549.1.1
      |  |  05 00          ;NULL (0 bytes)
      |  03 82 02 0F 00    ;BIT STRING  (0x20f = 527 bytes)
      |  |  30 82 02 0A       ;SEQUENCE (0x20a = 522 bytes)
      |  |  |  02 82 02 01    ;INTEGER  (0x201 = 513 bytes)
      |  |  |  |  00             ;leading zero of INTEGER
      |  |  |  |  ... [512 bytes modulus n]
      |  |  |  02 03          ;INTEGER (03 = 3 bytes)
      |  |  |  |  ... [3 bytes exponent e, normally 0x010001]

    */

    var publicKeyHex = '30820222'
    + '300D'
    + '0609'
    + '2A864886F70D010101'
    + '0500'
    + '0382020F00'
    + '3082020A'
    + '02820201'
    + '00'
    + modulusHex
    + '0203'
    + exponentHex;

    // convert DER encoded to PEM (Base64) encoded
    var publicKeyBase64 = Encode.toBase64(Encode.fromHex(publicKeyHex));
    return publicKeyBase64;
}
