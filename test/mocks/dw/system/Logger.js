exports.getLogger = function (category) {
    return {
        debugEnabled: false,
        errorEnabled: true,
        NDC: {}
    };
};
