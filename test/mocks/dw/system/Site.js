const boltMerchantDivisionID = 'boltMerchantDivisionID';
const boltMultiPublishableKey = 'publishable_key';
const boltEnable = true;
const boltEnvironment = 'sandbox';
const boltApiURL = 'https://api-sandbox.bolt.com';
const boltConnectURL = 'https://connect-sandbox.bolt.com';

function getCurrent() {
    return {
        getCustomPreferenceValue: function (val) {
            switch (val) {
                case 'boltMultiPublishableKey':
                    return boltMultiPublishableKey;
                case 'boltEnable':
                    return boltEnable;
                case 'boltMerchantDivisionID':
                    return boltMerchantDivisionID;
                case 'boltEnvironment':
                    return boltEnvironment;
                default:
                    return 'some_custom_preference_value';
            }
        }
    };
}

module.exports = {
    boltMerchantDivisionID: boltMerchantDivisionID,
    boltMultiPublishableKey: boltMultiPublishableKey,
    boltEnable: boltEnable,
    boltEnvironment: boltEnvironment,
    boltApiURL: boltApiURL,
    boltConnectURL: boltConnectURL,
    getCurrent: getCurrent
};
