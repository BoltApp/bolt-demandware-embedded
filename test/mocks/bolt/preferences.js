function getSitePreferences() {
    return {
        boltEnable: true,
        boltMerchantDivisionID: 'merchant division id',
        boltApiUrl: 'bolt api url',
        boltCdnUrl: 'bolt cdn url',
        boltMultiPublishableKey: 'publishable key'
    };
}

function getBoltAPIKey() {
    return 'bolt api key';
}

function getSitePreferences() {
    return {
        boltApiUrl: 'https://api-sandbox.bolt.com',
        boltApiKey: '123456',
        boltMultiPublishableKey: 'abcdefg'
    };
}

module.exports = {
    getSitePreferences: getSitePreferences,
    getBoltAPIKey: getBoltAPIKey
};
