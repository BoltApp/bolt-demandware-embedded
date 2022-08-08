'use strict';

/**
 * Return the iso language code based on local of the site
 * @param {string} locale - current locale
 * @returns {string} - ISO code
 */
function getISOCodeByLocale(locale) {
    return locale.replace('_', '-').toLowerCase();
}

/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

module.exports = {
    getISOCodeByLocale: getISOCodeByLocale,
    validateEmail: validateEmail
};
