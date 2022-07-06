"use strict";

var paymentComponent, boltEmbedded, accountCheck, boltCreateAccount;

var accountCheckOptions = {
  defaultValue: false,
  version: "compact",
  listeners: {
    change: function (value) {
      boltCreateAccount = value;
    },
  },
};

var renderBoltEmbeddedPaymentFields = function () {
  if (paymentComponent == null && boltEmbedded) {
    paymentComponent = boltEmbedded.create("payment_component");
    paymentComponent.mount(document.getElementById("div-to-inject-field-into"));
  }
};

var renderBoltCreateAccountCheckField = function () {
  if (boltEmbedded) {
    accountCheck = boltEmbedded.create("account_checkbox", accountCheckOptions);
    accountCheck.mount("#acct-checkbox");
  }
};

var getToken = async function () {
  return await paymentComponent.tokenize();
};

var paymentSelected = function (paymentOptions) {
  var paymentATag = paymentOptions.find(".nav-link");
  for (let i = 0; i < paymentATag.length; i++) {
    if (paymentATag[0].getAttribute("aria-selected") === "true") {
      return true;
    }
  }
  return false;
};

var initEmbeddedPaymentFields = function () {
  var paymentOptions = $(".payment-options").children("li");
  if (paymentOptions.length > 0 && !paymentSelected(paymentOptions)) {
    $('[data-method-id="BOLT_PAY"] a').trigger("click");
  }
};

var tokenize = function (event, data) {
  getToken().then(
    function (response) {
      var serializedArray = data.form.serializeArray();
      for (const property in response) {
        serializedArray.push({
          name: property,
          value: response[property],
        });
      }
      serializedArray.push({
        name: "create_bolt_account",
        value: boltCreateAccount,
      });
      data.callback($.param(serializedArray));
    },
    function (error) {
      console.log("Error on getting Bolt token: ", error);
    }
  );
};

$("body").ready(function () {
  var isBoltEmbeddedExists = setInterval(function () {
    if (typeof Bolt !== "undefined") {
      clearInterval(isBoltEmbeddedExists);
      boltEmbedded = Bolt($(".bolt-publishable-key").val());
      initEmbeddedPaymentFields();
      renderBoltCreateAccountCheckField();
    }
  }, 500);
});

$('[data-method-id="BOLT_PAY"]').click(function () {
  renderBoltEmbeddedPaymentFields();
});

$("body").on("checkout:tokenize", tokenize);
