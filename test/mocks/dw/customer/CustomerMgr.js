'use strict';

module.exports = {
    loginExternallyAuthenticatedCustomer(authenticationProviderId, externalId, rememberMe) {
        session.privacy.loginfrombolt = true;
        return ''
    }
};