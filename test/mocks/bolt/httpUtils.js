var HttpResult = require('../dw/svc/Result');

function restAPIClient() {
    return {
        status: HttpResult.OK,
        errors: [],
        result: {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            refresh_token_scope: 'scope',
            expires_in: 1234
            // add more to this object if needed
        }
    };
}

module.exports = {
    restAPIClient: restAPIClient
};
