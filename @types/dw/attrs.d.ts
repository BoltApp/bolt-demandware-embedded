/**
 * Custom attributes for Basket object.
 */
declare class BasketCustomAttributes {
  /**
   * Bolt Dynamic Add-Ons in JSON format
   */
  boltDynamicAddOns: string;
}

/**
 * Custom attributes for Order object.
 */
declare class OrderCustomAttributes {
  /**
   * Auth Amount
   */
  boltAuthAmount: number;

  /**
   * Is Auto Capture
   */
  boltAutoCapture: boolean;

  /**
   * Capture Amount
   */
  boltCaptureAmount: number;

  /**
   * Is Gift
   */
  boltCustomCheckboxGift: boolean;

  /**
   * Is Loyalty
   */
  boltCustomCheckboxLoyalty: boolean;

  /**
   * Is Newsletter
   */
  boltCustomCheckboxNewsLetter: boolean;

  /**
   * Is Other Checkbox
   */
  boltCustomCheckboxOther: boolean;

  /**
   * Bolt Custom Field List in JSON format
   */
  boltCustomFieldList: string;

  /**
   * Bolt Demandware Link Order ID
   */
  boltDWLinkOrderID: string;

  /**
   * Bolt SFCC Link Order Token
   */
  boltDWLinkOrderToken: string;

  /**
   * Is Multi Checkout
   */
  boltMultiCheckout: boolean;

  /**
   * Order Placement Fail
   */
  boltOrderplacementFail: boolean;

  /**
   * Paid Amount
   */
  boltPaidAmount: number;

  /**
   * Bolt Transaction History
   */
  boltTransactionHistory: string;

  /**
   * Bolt Transaction ID
   */
  boltTransactionID: string;

  /**
   * Bolt Transaction Reference
   */
  boltTransactionReference: string;

  /**
   * Bolt Transaction Status
   */
  boltTransactionStatus: string;

  /**
   * Bolt Transaction Type
   */
  boltTransactionType: string;

  /**
   * Bolt Transaction Processor
   */
  boltTransactionProcessor: string;

  /**
   * is Bolt Order
   */
  isBoltOrder: boolean;

  /**
   * Additional params that might be required by third party fraud systems.
   */

  /**
   * Fraud: Browser connection param
   */

  fraudBrowserConnection: string;

  /**
   * Fraud: Browser accepted charset param
   */

  fraudBrowserAcceptCharset: string;

  /**
   * Fraud: accepted browser param
   */

  fraudBrowserAccept: string;

  /**
   * Fraud: Browser accepted encoding param
   */

  fraudBrowserAcceptEncoding: string;

  /**
   * Fraud: Browser Id language code param
   */

  fraudBrowserIdLanguageCode: string;

  /**
   * Fraud: Browser referrer param
   */
  fraudBrowserReferer: string;

  /**
   * Fraud: Browser ID param
   */
  fraudBrowserID: string;

  /**
   * Fraud: host name param
   */
  fraudHostname: string;

  /**
   * Fraud: remote host param
   */
  fraudRemoteHost: string;

  /**
   * Fraud: time spent on site param
   */
  fraudTimeSpentOnSiteStr: string;

  /**
   * Fraud: Browser session ID param
   */
  fraudBrowserSessionId: string;

  /**
   * Fraud: Device fingerprint param
   */
  fraudDeviceFingerprint: string;

  /**
   * Payment custom attributes
   */

  /**
   * Payment: Authorization Response Code
   */
  authorizationResponseCode: string;

  /**
   * Payment: avs Response Code
   */
  avsResponseCode: string;

  /**
   * Payment: bank Authorization Code
   */
  bankAuthorizationCode: string;

  /**
   * Payment: cvv Authorization Code
   */
  cvvAuthorizationCode: string;

  /**
   * Payment: tenderType
   */
  tenderType: string;

  /**
   * Payment: panToken
   */
  panToken: string;

  /**
   * Payment: authorization Request Id
   */
  authorizationRequestId: string;

  /**
   * Payment: recurringDetailReference
   */

  recurringDetailReference: string;

  /**
   * Payment: shopperReference
   */
  shopperReference: string;

  /**
   * Payment: alias
   */
  alias: string;

  /**
   * Payment: amazonOrderReferenceId
   */
  amazonOrderReferenceId: string;

  /**
   * Payment: amazonAuthorizationId
   */
  amazonAuthorizationId: string;

  /**
   * Payment: alternateOrderId
   */
  alternateOrderId: string;
}

/**
 * Custom attributes for OrderPaymentInstrument object.
 */
declare class OrderPaymentInstrumentCustomAttributes {
  /**
   * Credit Card Expiration Month
   */
  boltCardExpirationMonth: number;

  /**
   * Credit Card Expiration Year
   */
  boltCardExpirationYear: string;

  /**
   * Credit Card Last 4 Digits
   */
  boltCreditCardLastDigits: string;

  /**
   * Credit Card Type
   */
  boltCreditCardType: string;

  /**
   * Token Type
   */
  boltTokenType: string;

  /**
   * Gift Card ID
   */
  giftCardID: string;

  /**
   * Gift Card Pin
   */
  giftCardPin: string;

  /**
   * Gift Card Status
   */
  giftCardStatus: string;

  /**
   * Gift Card Time Added (Unix Timestamp)
   */
  giftCardTimeAdded: number;

  /**
   * Gift Card Redemption Id
   */
  giftCardRedemptionId: string;
}

/**
 * Custom attributes for ProductLineItem
 */

declare class ProductLineItemCustomAttributes {
  /**
   * Store Id associated to the product
   */
  fromStoreId: string;

  /**
   * boolean indicating if the productlineitem is shipped to a POBox address
   */
  isPOBox: boolean;
}

/**
 * Custom attributes for OrganizationPreferences object.
 */
declare class OrganizationPreferencesCustomAttributes {
  /**
   * Validation String which is sent if Apple requests /.well-known/apple-developer-merchantid-domain-association and a static URL mapping exists for a site which runs in root context (GLOBAL). Mapping rule must be /.well-known/apple-developer-merchantid-domain-association s,,,,,/apple-developer-merchantid-domain-association
   */
  appleDeveloperMerchantidDomainAssociation: string;
}

/**
 * Custom attributes for SitePreferences object.
 */
declare class SitePreferencesCustomAttributes {
  /**
   * Bolt API URL
   */
  boltAPI: string;

  /**
   * API Key
   */
  boltAPIKey: string;

  /**
   * Publishable Key - Back Office
   */
  boltBackOfficePublishableKey: string;

  /**
   * Enable Cart Ajax Update
   */
  boltCartAjaxUpdateEnable: boolean;

  /**
   * Enable Bolt Pay
   */
  boltEnable: boolean;

  /**
   * Display Bolt Checkout for Back Office payments
   */
  boltEnableBackOffice: boolean;

  /**
   * Display Bolt Checkout on the Cart Page
   */
  boltEnableCartPage: boolean;

  /**
   * Display Bolt Checkout on the Native Checkout Page
   */
  boltEnableCheckoutPage: boolean;

  /**
   * Gift Cetificate Enable
   */
  boltGiftCertificateEnable: boolean;

  /**
   * Publishable Key - Multistep
   */
  boltMultiPublishableKey: string;

  /**
   * Preauth Enable
   */
  boltPreauthEnable: boolean;

  /**
   * Signing Secret
   */
  boltSigningSecret: string;

  /**
   * Bolt Environment
   */
  boltEnvironment: string;

  /**
   * Bolt Merchant Division ID
   */
  boltMerchantDivisionID: string;
}
/**
 * Custom attributes for ActiveData object.
 */
declare class ActiveDataCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for BonusDiscountLineItem object.
 */
declare class BonusDiscountLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Campaign object.
 */
declare class CampaignCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Catalog object.
 */
declare class CatalogCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Category object.
 */
declare class CategoryCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CategoryAssignment object.
 */
declare class CategoryAssignmentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Content object.
 */
declare class ContentCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CouponLineItem object.
 */
declare class CouponLineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomObject object.
 */
declare class CustomObjectCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomerAddress object.
 */
declare class CustomerAddressCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for CustomerGroup object.
 */
declare class CustomerGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for EncryptedObject object.
 */
declare class EncryptedObjectCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Folder object.
 */
declare class FolderCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for GiftCertificate object.
 */
declare class GiftCertificateCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Library object.
 */
declare class LibraryCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for LineItem object.
 */
declare class LineItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for LineItemCtnr object.
 */
declare class LineItemCtnrCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for OrderAddress object.
 */
declare class OrderAddressCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentCard object.
 */
declare class PaymentCardCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentMethod object.
 */
declare class PaymentMethodCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentProcessor object.
 */
declare class PaymentProcessorCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PaymentTransaction object.
 */
declare class PaymentTransactionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for PriceBook object.
 */
declare class PriceBookCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Product object.
 */
declare class ProductCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductInventoryList object.
 */
declare class ProductInventoryListCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductInventoryRecord object.
 */
declare class ProductInventoryRecordCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  isStoreInventoryAllocated: boolean;
}

/**
 * Custom attributes for ProductList object.
 */
declare class ProductListCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductListItem object.
 */
declare class ProductListItemCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductListItemPurchase object.
 */
declare class ProductListItemPurchaseCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductListRegistrant object.
 */
declare class ProductListRegistrantCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductOption object.
 */
declare class ProductOptionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ProductOptionValue object.
 */
declare class ProductOptionValueCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Promotion object.
 */
declare class PromotionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  cartMessage: string;
}

/**
 * Custom attributes for Recommendation object.
 */
declare class RecommendationCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Request object.
 */
declare class RequestCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for SearchRefinementDefinition object.
 */
declare class SearchRefinementDefinitionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ServiceConfig object.
 */
declare class ServiceConfigCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for ServiceProfile object.
 */
declare class ServiceProfileCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Session object.
 */
declare class SessionCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Shipment object.
 */
declare class ShipmentCustomAttributes {
  /**
   * boolean indicating if the productlineitem is shipped to a POBox address
   */
  isPOBox: boolean;
}

/**
 * Custom attributes for ShippingMethod object.
 */
declare class ShippingMethodCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for SourceCodeGroup object.
 */
declare class SourceCodeGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Store object.
 */
declare class StoreCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for StoreGroup object.
 */
declare class StoreGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for Variant object.
 */
declare class VariantCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for VariationGroup object.
 */
declare class VariationGroupCustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}

/**
 * Custom attributes for customer Profile object.
 */
declare class ProfileCustomAttributes {
  /**
   * boolean indicating if the customer has consented to receiving marketing emails from the merchant
   */
  allowMarketingEmails: boolean;

  /**
   * boolean indicating if the customer has consented to receiving marketing SMS from the merchant
   */
  allowMarketingSMS: boolean;
}
