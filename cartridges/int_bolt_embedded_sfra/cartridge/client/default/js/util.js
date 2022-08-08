'use strict';

/**
 * Return the iso language code based on local of the site
 * @param {string} locale - current locale
 * @returns {string} - ISO code
 */
function getISOCodeByLocale(locale) {
    return locale.replace('_', '-').toLowerCase();
}

module.exports = {
    getISOCodeByLocale: getISOCodeByLocale
};
