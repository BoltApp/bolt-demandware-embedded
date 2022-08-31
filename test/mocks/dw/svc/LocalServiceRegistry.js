var HttpResult = require('./Result');


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

