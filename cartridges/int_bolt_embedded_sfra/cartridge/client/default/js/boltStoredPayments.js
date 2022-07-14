$(document).ready(function () {
    const radioButtonLoaded = setInterval(function (){
        const useExistingCardBtn = $('#use-existing-card-radio-button');
        const addNewCardBtn = $('#add-a-new-card-radio-button');
        if (useExistingCardBtn && addNewCardBtn){
            clearInterval(radioButtonLoaded);
            useExistingCardBtn.click(function () {
                if(this.checked){
                    $('#bolt-stored-payment-selector').removeClass('d-none');
                    $('#new-credit-card-form').addClass('d-none');
                }
            });

            addNewCardBtn.click(function() {
                if(this.checked){
                    $('#bolt-stored-payment-selector').addClass('d-none');
                    $('#new-credit-card-form').removeClass('d-none');
                }
            });
        }
    }, 100);

    const boltPaySelectorLoaded = setInterval(function (){
        const boltPaySelector = $('#bolt-stored-payment-selector');
        if (boltPaySelector) {
            clearInterval(boltPaySelectorLoaded);
            boltPaySelector.change(function () {
                // adding bolt pay id to payment content so that it's sent to auth when clicking "Place Order"
                const boltPayID = $("#bolt-stored-payment-selector option:selected").val();
                $('.final-payment-method-id').value = boltPayID;
            });
        }
    }, 100);
});

