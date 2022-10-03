'use strict';

var base = require('base/checkout/address');

// Overwrite addNewAddress function to clear shipping form boltAddressId
// when user selects a new address
base.addNewAddress = function () {
    $('.btn-add-new').on('click', function () {
        var $el = $(this);
        if ($el.parents('#dwfrm_billing').length > 0) {
            // Handle billing address case
            $('body').trigger('checkout:clearBillingForm');
            var $option = $($el.parents('form').find('.addressSelector option')[0]);
            $option.attr('value', 'new');
            var $newTitle = $('#dwfrm_billing input[name=localizedNewAddressTitle]').val();
            $option.text($newTitle);
            $option.prop('selected', 'selected');
            $el.parents('[data-address-mode]').attr('data-address-mode', 'new');
        } else {
            // Handle shipping address case
            var $newEl = $el.parents('form').find('.addressSelector option[value=new]');
            // Clear Bolt address id
            var form = $('form[name=dwfrm_shipping]');
            $('input[name$=_boltAddressId]', form).val('');
            $newEl.prop('selected', 'selected');
            $newEl.parent().trigger('change');
        }
    });
};

module.exports = base;
