# Bolt SFRA Cartridges for Embedded Checkout

## int_bolt_sfra_embedded: Storefront Reference Architecture (SFRA)

## Getting Started

1. Clone this repository. (The name of the top-level folder is bolt\-demandware-embedded.)
2. In the top-level `/bolt-demandware-embedded` folder, enter the following command: `npm install`. (This command installs all of the package dependencies required for this cartridge.)
3. In the top-level `/bolt-demandware` folder, edit the `paths.base` property in the package.json file. This property should contain a relative path to the local directory containing the Storefront Reference Architecture repository. For example:

```
"paths": {
    "base": "../storefront-reference-architecture/cartridges/app_storefront_base/"
  }
```

4. Create `dw.json` file in the root of the project:

```json
{
  "hostname": "your-sandbox-hostname.demandware.net",
  "username": "yourlogin",
  "password": "yourpwd",
  "code-version": "version_to_upload_to"
}
```

5. In the top-level `/storefront-reference-architecture` folder, enter the following command: `npm run compile:js && npm run compile:scss`
6. In the top-level `/storefront-reference-architecture` folder, enter the following command: `npm run uploadCartridge`

Note: if you upload the bolt cartridge with a new `code-version`, you will need to re-run step 5 and 6.

# NPM scripts

Use the provided NPM scripts to compile and upload changes to your Sandbox.

## Upload all cartridges to SFCC instance

`npm run upload:all`

## Linting your code

`npm run lint` - Execute linting for all JavaScript and SCSS files in the project. You should run this command before committing your code.

#Testing

## TODO: Running unit tests

## TODO: Running integration tests

## Locale support

supported locales: `en-US`, `en-CA`, `fr-CA`

# Features

## Supported Payment Methods

- Bolt Payments
- Paypal
- After pay
- Affirm
- Klarna
- Amazon pay
- Apple pay
