var HttpResult = require('./Result');

const returnedResult = {
    key: 'value'
};
exports.returnedResult = returnedResult;

exports.createService = function () {
    return {
        call: function () {
            return {
                status: HttpResult.OK,
                object: returnedResult
            };
        }
    };
};

