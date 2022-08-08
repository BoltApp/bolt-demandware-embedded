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

module.exports = {
    getSitePreferences: getSitePreferences,
    getBoltAPIKey: getBoltAPIKey
};
