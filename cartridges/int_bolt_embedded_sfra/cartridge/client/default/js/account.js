"use strict";

async function authorizeWithEmail(customerEmail){
  const boltPublishableKey = $('.bolt-publishable-key').val();
  const boltEmbedded = Bolt(boltPublishableKey);
  const authorizationComponent = boltEmbedded.create("authorization_component",  {style: {position: "right"}} );
  await authorizationComponent.mount(".card.customer-section") // mount on the div container otherwise the iframe won't render

  return await authorizationComponent.authorize({"email":customerEmail});;
}

async function authorizeUser(email){
  const authorizeWithEmailResp = await authorizeWithEmail(email);
  const OauthResp = await authenticateUserWithCode(authorizeWithEmailResp.authorizationCode, authorizeWithEmailResp.scope);
  return await getAccountDetails(OauthResp.accessToken);
}

function authenticateUserWithCode(authCode, scope){
  const authenticateUserUrl = $('.authenticate-bolt-user').val();
  const reqBody = {
    code: authCode,
    scope: scope
  }
  return $.ajax({
    url: authenticateUserUrl,
    method: 'GET',
    data: reqBody,
  });
}

function getAccountDetails(oauthToken){
  const accountDetailUrl = $('.get-bolt-account-details').val();
  const reqBody = {
    bearerToken: oauthToken
  }
  return $.ajax({
    url: accountDetailUrl,
    method: 'GET',
    data: reqBody,
    success: function(data) {
      window.location.href = data.redirectUrl;
    }
  });
}

$(document).ready(function () {
  const emailInputLoaded = setInterval(function (){
    const emailInput = $('#email-guest'); // guest email input - rename to bolt specific?
    if (emailInput){
      clearInterval(emailInputLoaded);
      emailInput.focusout(function(){
        const customerEmail = emailInput.val()
        const checkBoltAccountUrl = $('.check-bolt-account-exist').val();
        const reqBody = {
          email: customerEmail
        }
        $.ajax({
          url: checkBoltAccountUrl,
          method: 'GET',
          data: reqBody,
          success(data) {
            if (data !== null) {
              if (data.hasBoltAccount){
                const authorizationResponse = authorizeUser(customerEmail);
                // TODO: fill in shopper details by sending this code to a controller & fill basket from Backend
              }
            }
          },
        });
      })
    }
  }, 100) 
})