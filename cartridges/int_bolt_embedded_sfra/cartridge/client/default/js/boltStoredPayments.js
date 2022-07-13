$(document).ready(function () {
    const radioButtonLoaded = setInterval(function (){
        const useExistingCardBtn = $('#use-existing-card-radio-button');
        const addNewCardBtn = $('#add-a-new-card-radio-button');
        if (useExistingCardBtn && addNewCardBtn){
            clearInterval(radioButtonLoaded);
            useExistingCardBtn.click(function () {
                if(this.checked){
                    $('#bolt-stored-payment-selector').removeClass('d-none');
                    $('.new-credit-card-form').addClass('d-none');

                    // TODO: make a network call to set payment instrument on basket
                }
            });

            addNewCardBtn.click(function() {
                if(this.checked){
                    $('#bolt-stored-payment-selector').addClass('d-none');
                    $('.new-credit-card-form').removeClass('d-none');

                    // TODO: investigate if we need to make a call to set payment instrument on basket
                }
            });
        }
    }, 100);
});

