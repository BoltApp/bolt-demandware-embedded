'use strict';

var request = {
    "cart": {
        "order_reference": "00000708",
        "total_amount": 58791,
        "tax_amount": 2800,
        "currency": "USD",
        "billing_address": {
            "street_address1": "1 infinite loop",
            "street_address2": "",
            "locality": "cupertino",
            "region": "CA",
            "postal_code": "95014",
            "country_code": "US",
            "country": "United States",
            "name": "justin xie",
            "first_name": "justin",
            "last_name": "xie",
            "phone_number": "9234567890",
            "email": "jxie@bolt.com",
            "phone": "9234567890"
        },
        "in_store_cart_shipments": [],
        "items": [
            {
                "name": "Silver Chandler Earring",
                "reference": "013742000269M",
                "quantity": 1,
                "type": "physical",
                "image_url": "https://zzgv-004.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6875bcc9/images/large/PG.60108564.JJNY2XX.PZ.jpg",
                "total_amount": 2900,
                "unit_price": 2900
            },
            {
                "name": "Sony Playstation 3 Game Console",
                "reference": "sony-ps3-consoleM",
                "quantity": 2,
                "type": "physical",
                "image_url": "https://zzgv-004.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-electronics-m-catalog/default/dw42e685c0/images/large/sony-ps3-console.jpg",
                "total_amount": 75996,
                "unit_price": 37998
            }
        ],
        "discounts": [
            {
                "amount": 1000,
                "description": "order-10off-auto"
            },
            {
                "amount": 22400,
                "description": "Coupon (discount)",
                "discount_category": "coupon",
                "discount_code": "discount",
                "reference": "discount"
            }
        ],
        "shipments": [
            {
                "shipping_address": {
                    "first_name": "justin",
                    "last_name": "xie",
                    "email": "jxie@bolt.com",
                    "phone": "9234567890",
                    "street_address1": "1 infinite loop",
                    "street_address2": "",
                    "locality": "cupertino",
                    "region": "CA",
                    "postal_code": "95014",
                    "country_code": "US",
                    "country": "United States"
                },
                "cost": 495,
                "service": "Standard"
            }
        ]
    },
    "division_id": "-GZW2YSKRCU1",
    "source": "direct_payments",
    "user_identifier": {
        "email": "jxie@bolt.com",
        "phone": "9234567890"
    },
    "user_identity": {
        "first_name": "justin",
        "last_name": "xie"
    },
    "create_bolt_account": false,
    "auto_capture": true,
    "credit_card": {
        "token": "77d9ee7dcacfe9be5a9fa93966b8d83fc8c3ebf38e15617b538c1650176ecb55",
        "last4": "1111",
        "bin": "411111",
        "billing_address": {
            "street_address1": "1 infinite loop",
            "street_address2": "",
            "locality": "cupertino",
            "region": "CA",
            "postal_code": "95014",
            "country_code": "US",
            "country": "United States",
            "name": "justin xie",
            "first_name": "justin",
            "last_name": "xie",
            "phone_number": "9234567890",
            "email": "jxie@bolt.com",
            "phone": "9234567890"
        },
        "number": "",
        "expiration": "2030-03",
        "postal_code": "95014",
        "token_type": "bolt"
    }
};

function build() {
    return {
        authRequest: request,
        error: false
    };
}
module.exports = {
    build: build
};
