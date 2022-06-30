"use strict";

async function renderOTP(customerEmail){
  const boltPublishableKey = $('.bolt-publishable-key').val()
  const boltEmbedded = Bolt(boltPublishableKey);
  const authorizationComponent = boltEmbedded.create("authorization_component",  {style: {position: "right"}} );
  await authorizationComponent.mount(".card.customer-section") // mount on the div container otherwise the iframe won't render
  
  const authorizationResponse = await authorizationComponent.authorize({"email":customerEmail})
  console.log(authorizationResponse)
  return authorizationResponse;
}

$(document).ready(function () {
  const emailInputLoaded = setInterval(function (){
    const emailInput = $('#email-guest') // guest email input - rename to bolt specific? 
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
                const authorizationResponse = renderOTP(customerEmail);
                // TODO: fill in shopper details by sending this code to a controller & fill basket from Backend
              }
            }
          },
        });
      })
    }
  }, 100) 
})