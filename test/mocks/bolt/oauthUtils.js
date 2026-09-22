'use strict';

function getOAuthConfiguration() {
    return {
        clientID: 'cid123',
        boltAPIbaseURL: 'https://api.boltapp.com',
        providerID: 'pid123'
    };
}

function createPlatformAccount(externalProfile, orderId, orderToken) {
    var credentials = {
        isEnabled: () => true,
    }
    return {
        profile: {
            getCredentials: () => credentials
        }
    };
}

module.exports = {
    getOAuthConfiguration: getOAuthConfiguration,
    createPlatformAccount: createPlatformAccount
};
