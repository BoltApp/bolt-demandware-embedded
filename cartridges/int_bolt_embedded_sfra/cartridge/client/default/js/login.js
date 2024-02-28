'use strict';

const account = require('./account');

(async () => {
    await account.waitForBoltReady();

    const loginModalComponent = Bolt.getComponent('login_modal') || Bolt.create('login_modal');

    const loginFormEmail = document.querySelector(window.BoltSelectors.signInEmailField).parentElement;
    loginModalComponent.attach(loginFormEmail, { context: 'sign_in' });

    const registerFormEmail = document.querySelector(window.BoltSelectors.registerEmailField).parentElement;
    loginModalComponent.attach(registerFormEmail, { context: 'register' });

    const passwordReset = document.querySelector('#password-reset');
    let detach = loginModalComponent.attach(passwordReset, { context: 'forgot_password' });

    const href = passwordReset.getAttribute('href');
    passwordReset.setAttribute('href', '#');
    passwordReset.removeAttribute('data-toggle');

    passwordReset.addEventListener('click', event => {
        event.preventDefault();
    });

    const unsubscribe = Bolt.on('forgot_password_continue', () => {
        detach();
        passwordReset.setAttribute('href', href);
        passwordReset.setAttribute('data-toggle', 'modal');
        passwordReset.click();
        unsubscribe();

        detach = loginModalComponent.attach(passwordReset, { context: 'forgot_password' });
    });

    account.setupListenersLogin();
})();
