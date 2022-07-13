$(document).ready(function () {
    const radioButtonLoaded = setInterval(function (){
        console.log("loading radio buttons ");
        const useExistingCardBtn = $('#use-existing-card-radio-button');
        const addNewCardBtn = $('#add-a-new-card-radio-button');
        if (useExistingCardBtn && addNewCardBtn){
            console.log("radio button loaded");
            clearInterval(radioButtonLoaded);
            useExistingCardBtn.click(function () {
                if(this.checked){
                    $('#bolt-stored-payment-selector').removeClass('d-none');
                    $('.new-credit-card-form').addClass('d-none');
                }
            });

            addNewCardBtn.click(function() {
                if(this.checked){
                    $('#bolt-stored-payment-selector').addClass('d-none');
                    $('.new-credit-card-form').removeClass('d-none');
                }
            });
        }
    }, 100);
});

