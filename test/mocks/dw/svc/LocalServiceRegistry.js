var HttpResult = require('./Result');
exports.createService = function () {
    return {
        call: function () {
            return {
                status: HttpResult.OK
            };
        }
    };
};
