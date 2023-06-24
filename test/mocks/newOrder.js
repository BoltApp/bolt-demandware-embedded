'use strict';

var ArrayList = require('./dw.util.Collection');

var billingAddress = {
    getPostalCode(){
        return '02135';
    },
    getAddress1(){
        return '65 May Lane';
    },
    getAddress2(){
        return '';
    },
    getCity(){
        return 'Allston';
    },
    getStateCode(){
        return 'MA';
    },
    getCountryCode(){
        return {
            getDisplayValue(){
                return 'United States';
            },
            getValue(){
                return 'US';
            }
        }
    },
    getFirstName(){
        return 'Amanda';
    },
    getLastName(){
       return 'Jones';
    },
    getPhone(){
        return '617-555-1234';
    },
    getFullName(){
        return 'Amanda Jones';
    }
};

var standardShippingMethod = {
        getDisplayName(){
            return 'Standard'
        },
        getID(){
            return 'Standard'
        }
};

var instoreShippingMethod = {
    getDisplayName(){
        return 'ShipToStore'
    },
    getID(){
        return 'ShipToStore'
    }
};

var shippingAddress = {
    address1 : 'address1',
    address2 : '',
    city : 'city',
    stateCode : 'MA',
    postalCode : '02135',
    countryCode :  { value: 'us' },
    firstName : 'firstName',
    lastName : 'lastName',
    phone : '617-555-1234',
    custom:{
        boltAddressId : 'boltAddressId'
    },
    getPostalCode(){
        return this.postalCode;
    },
    getAddress1(){
        return this.address1;
    },
    getAddress2(){
        return this.address2;
    },
    getCity(){
        return this.city;
    },
    getStateCode(){
        return this.postalCode;
    },
    getCountryCode(){
        return {
            getDisplayValue(){
                return 'United States';
            },
            getValue(){
                return 'US';
            }
        }
    },
    getFirstName(){
        return this.firstName;
    },
    getLastName(){
       return this.lastName;
    },
    getPhone(){
        return this.phone;
    }
};

var optionProductLineItem = {
    getOptionID(){
        return 'optionID';
    },
    getAdjustedNetPrice(){
        return {
            getValue(){
                return 59.98;
            }
        };
    },
    getAdjustedPrice(){
        return {
            getValue(){
                return 59.98;
            }
        };
    },
    getPriceAdjustments(){
        return new ArrayList([]);
    }
};

var appliedCouponLineItem = {
    couponCode : 'discount',
    getCouponCode(){
        return this.couponCode;
    },
    isApplied(){
        return true;
    }
}

var unappliedCouponLineItem = {
    couponCode : 'unapplied',
    getCouponCode(){
        return this.couponCode;
    },
    isApplied(){
        return false;
    }
}

var orderPriceAdjustments = new ArrayList([
    {
        getCouponLineItem(){
            return null;
        },
        isBasedOnCoupon(){
            return false;
        },
        getPrice(){
            return -10.00;
        },
        getPriceValue(){
            return -10.00;
        },
        getPromotionID(){
            return 'orderPromotionAuto'
        },
        getPromotion(){
            return orderPromotionAuto;
        }
    },
    {
        getCouponLineItem(){
            return appliedCouponLineItem;
        },
        isBasedOnCoupon(){
            return true;
        },
        getPrice(){
            return -20.00;
        },
        getPriceValue(){
            return -20.00;
        },
        getPromotionID(){
            return 'promotionID2'
        },
        getPromotion(){
            return orderPromotionCoupon;
        }
    }
]);

var orderPromotionAuto = {
    custom:{
        cartMessage: 'orderPromotionAuto'
    }
};

var orderPromotionCoupon =  {
    custom:{
        cartMessage: 'orderPromotionCoupon'
    }
}


var couponLineItems = new ArrayList([appliedCouponLineItem, unappliedCouponLineItem]);

var giftCertificatePaymentInstruments = new ArrayList([
    {
        getPaymentTransaction(){
            return {
                getAmount(){
                    return {
                        getValue(){
                            return 5.00;
                        }
                    }
                }
            }
        },
        getMaskedGiftCertificateCode(){
            return '************1234';
        }
    }
]);

var shippingPriceAdjustments = new ArrayList([
    {
        getCouponLineItem(){
            return null;
        },
        isBasedOnCoupon(){
            return false;
        },
        getPrice(){
            return -1.00;
        },
        getPriceValue(){
            return -1.00;
        }
    },
    {
        getCouponLineItem(){
            return appliedCouponLineItem;
        },
        isBasedOnCoupon(){
            return true;
        },
        getPrice(){
            return -2.00;
        },
        getPriceValue(){
            return -2.00;
        }
    }
]);

var sonyPlayStationProductAdjustments = new ArrayList([
    {
        getCouponLineItem(){
            return null;
        },
        isBasedOnCoupon(){
            return false;
        },
        getPrice(){
            return -100.00;
        },
        getPriceValue(){
            return -100.00;
        }
    },
    {
        getCouponLineItem(){
            return appliedCouponLineItem;
        },
        isBasedOnCoupon(){
            return true;
        },
        getPrice(){
            return -200.00;
        },
        getPriceValue(){
            return -200.00;
        }
    }
]);

var earringProductAdjustments = new ArrayList([
    {
        getCouponLineItem(){
            return null;
        },
        isBasedOnCoupon(){
            return false;
        },
        getPrice(){
            return -1.00;
        },
        getPriceValue(){
            return -1.00;
        }
    },
    {
        getCouponLineItem(){
            return appliedCouponLineItem;
        },
        isBasedOnCoupon(){
            return true;
        },
        getPrice(){
            return -2.00;
        },
        getPriceValue(){
            return -2.00;
        }
    }
]);

var sonyPlayStationProduct = {
    getProductName(){
        return 'Sony PlayStation';
    },
    getProductID(){
        return 'sonyPlayStation';
    },
    getOptionID(){
        return null;
    },
    getAdjustedNetPrice(){
        return {
            getValue(){
                return 499.98;
            }
        };
    },
    getPriceAdjustments(){
        return sonyPlayStationProductAdjustments;
    },
    getOptionProductLineItems(){
        return new ArrayList([optionProductLineItem]);
    },
    getQuantityValue(){
        return 2;
    },
    getProduct(){
        return {
            getImage(){
                return {
                    getAbsURL(){
                        return 'image_URL';
                    }
                };
            }
        };
    }
};

var earringProduct = {
    getProductName(){
        return 'Earring';
    },
    getProductID(){
        return 'earring';
    },
    getOptionID(){
        return null;
    },
    getAdjustedNetPrice(){
        return {
            getValue(){
                return 27.00;
            }
        };
    },
    getPriceAdjustments(){
        return earringProductAdjustments;
    },
    getOptionProductLineItems(){
        return new ArrayList([]);
    },
    getQuantityValue(){
        return 1;
    },
    getProduct(){
        return {
            getImage(){
                return {
                    getAbsURL(){
                        return 'image_URL';
                    }
                };
            }
        };
    }
};

var productLineItems = new ArrayList([
    sonyPlayStationProduct,
    earringProduct
]);

var defaultShipment = {
    getShippingAddress(){
        return shippingAddress;
    },
    isGift(){
        return false;
    },
    getShippingMethod(){
        return standardShippingMethod;
    },
    getShippingMethodID(){
        return standardShippingMethod.getID();
    },
    getAdjustedShippingTotalNetPrice(){
        return {
            getValue(){
                return 2.95;
            }
        };
    },
    getShippingPriceAdjustments(){
        return shippingPriceAdjustments;
    }
};

var inStoreShipment = {
    custom:{
        fromStoreId : 'store1'
    },
    getShippingAddress(){
        return shippingAddress;
    },
    isGift(){
        return false;
    },
    getShippingMethod(){
        return instoreShippingMethod;
    },
    getShippingMethodID(){
        return instoreShippingMethod.getID();
    },
    getAdjustedShippingTotalNetPrice(){
        return {
            getValue(){
                return 0.00;
            }
        };
    },
    getShippingPriceAdjustments(){
        return new ArrayList([]);
    }
};

var giftCertificateLineItems = new ArrayList([
    {
        getRecipientEmail(){
            return 'Recipient@test.com';
        },
        getRecipientName(){
            return 'Recipient';
        },
        getSenderName(){
            return 'Sender';
        },
        getMessage(){
            return 'message';
        },
        getLineItemText(){
            return 'text';
        },
        getUUID(){
            return 'UUID';
        },
        getGrossPrice(){
            return {
                getValue(){
                    return 20.00;
                }
            };
        },
        getPrice(){
            return {
                getValue(){
                    return 20.00;
                }
            };
        }
    }
]);

function Order(){
    return {
        getGiftCertificatePaymentInstruments(){
            return giftCertificatePaymentInstruments;
        },
        getCouponLineItems(){
            return couponLineItems;
        },

        getPriceAdjustments(){
            return orderPriceAdjustments;
        },
        getGiftCertificateLineItems(){
            return giftCertificateLineItems;
        },
        getProductLineItems(){
            return productLineItems;
        },
        getCustomerEmail(){
            return 'test@test.com';
        },
        getBillingAddress(){
            return billingAddress;
        },
        getDefaultShipment(){
            return defaultShipment;
        },
        getShipments(){
            return new ArrayList([
                defaultShipment,
                inStoreShipment
            ]);
        },
        getTotalTax(){
            return {
                getValue(){
                    return 28.00;
                }
            }
        },
        getOrderNo(){
            return '1000000000'
        },
        getCurrencyCode(){
            return 'USD'
        }
    };
}

module.exports = Order;