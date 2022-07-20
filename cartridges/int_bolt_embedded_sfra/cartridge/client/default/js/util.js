'use strict';

// return the iso language code based on local of the site
export function getISOCodeByLocale(locale){
    return locale.replace("_", "-").toLowerCase();
}