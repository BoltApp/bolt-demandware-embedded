'use strict';

const account = require('./account');

(async () => {
    await account.waitForBoltReady();

    const loginModalComponent = Bolt.create('login_modal', {
        autoDetectEmail: true
    });

    const loginFormEmail = document.querySelector('#login-form-email').parentElement;
    loginModalComponent.attach(loginFormEmail, { context: 'sign_in' });

    const registerFormEmail = document.querySelector('#registration-form-email').parentElement;
    loginModalComponent.attach(registerFormEmail, { context: 'register' });

    account.setupListenersLogin();
})();
