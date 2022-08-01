"use strict";
var account = require("cartridges/int_bolt_embedded_sfra/cartridge/client/default/js/account.js");

// register the event listener on the $('#email-guest') component
// change the html element ID if you make change to $('#email-guest')
$(document).ready(function () {
  const emailInputLoaded = setInterval(function (){
    const emailInput = $('#email-guest');
    if (emailInput){
      clearInterval(emailInputLoaded);
      // we chose onfocusout callback to trigger the OTP modal. feel free to use a different callback if you'd like a different user experience
      emailInput.focusout(account.checkAccountAndFetchDetail);
    }
  }, 100);
})

// register the event listener on the logout button
$('#bolt-logout').click(function(){
  var url = $('#bolt-logout').attr('data-bolt-logout-url');

  account.logOut(url);
});
