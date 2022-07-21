$(document).ready(function () {
    const radioButtonLoaded = setInterval(function (){
        const useExistingCardBtn = $('#use-existing-card-radio-button');
        const addNewCardBtn = $('#add-a-new-card-radio-button');
        if (useExistingCardBtn && addNewCardBtn){
            clearInterval(radioButtonLoaded);
            useExistingCardBtn.click(function () {
                if(this.checked){
                    $('#bolt-stored-payment-selector').removeClass('d-none');
                    $('.bolt-pay').addClass('d-none');
                    setFinalPaymentMethodID();
                }
            });

            addNewCardBtn.click(function() {
                if(this.checked){
                    $('#bolt-stored-payment-selector').addClass('d-none');
                    $('.bolt-pay').removeClass('d-none');
                    $('#bolt-selected-payment-id').val('');
                }
            });
        }
    }, 100);

    const boltPaySelectorLoaded = setInterval(function (){
        const boltPaySelector = $('#bolt-stored-payment-selector');
        if (boltPaySelector) {
            clearInterval(boltPaySelectorLoaded);
            setFinalPaymentMethodID();
            boltPaySelector.change(function () {
                setFinalPaymentMethodID();
            });
        }
    }, 100);
});

// adding bolt pay id to payment content so that it's sent to auth when clicking "Place Order"
function setFinalPaymentMethodID(){
    const boltPayID = $("#bolt-stored-payment-selector option:selected").val();
    $('#bolt-selected-payment-id').attr('value', boltPayID);
}