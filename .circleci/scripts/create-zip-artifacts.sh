#!/usr/bin/env bash

GIT_TAG=$1

merchantList=()
# Load merchant list
merchants="./.circleci/scripts/merchants.txt"
if ! test -f "$merchants"; then
  echo "Cannot find the merchants file."
  exit 1
fi
echo "The following merchant versions will be released:"
echo "$GIT_TAG"
while IFS= read -r MERCHANT_NAME || [[ -n "$MERCHANT_NAME" ]]; do
  if [ ${#MERCHANT_NAME} -gt 0 ]; then
    merchantList+=("$MERCHANT_NAME")
    echo "$GIT_TAG-$MERCHANT_NAME"
  fi
done <"$merchants"

# Create release artifacts per mechant
create_release() {
  local MERCHANT_NAME=$1
  pwd
  cd ../"$MERCHANT_NAME" || exit
  DIR_PATH="cartridges/int_bolt_extensions/cartridge/scripts/merchant-custom/"
  DIR_PATH_PREFIX="src/"
  echo "Creating zip for $MERCHANT_NAME"
  for dir in "${DIR_PATH}"*/; do
    dir=${dir%*/}
    CURR_MX="${dir##*/}"
    # Delete all other merchant specific code in the src/cartridges/ and cartridges/
    if [[ "$MERCHANT_NAME" != "$CURR_MX" ]]; then
      EXCLUDE_PATH="${DIR_PATH_PREFIX}${DIR_PATH}${CURR_MX}/"
      rm -rf "$EXCLUDE_PATH"
      EXCLUDE_PATH="${DIR_PATH}${CURR_MX}/"
      rm -rf "$EXCLUDE_PATH"
    else
      # Update MERCHANT_NAME in metadata
      METADATA_PATH="metadata/bolt-meta-import/meta/system-objecttype-extensions.xml"
      sed -i.bak "s/MERCHANT_NAME/${CURR_MX}/g" $METADATA_PATH
      rm $METADATA_PATH.bak
      # Delete extraneous cartridges defined in delete.txt
      DELETE_PATH="${DIR_PATH}${CURR_MX}/delete.txt"
      while IFS= read -r CARTRIDGE || [[ -n "$CARTRIDGE" ]]; do
        if [ ${#CARTRIDGE} -gt 0 ]; then
          echo "Deleting $CARTRIDGE"
          CARTRIDGES_DIR="cartridges/"
          rm -rf "${DIR_PATH_PREFIX}${CARTRIDGES_DIR}${CARTRIDGE}"
          rm -rf "${CARTRIDGES_DIR}${CARTRIDGE}"
        fi
      done <"$DELETE_PATH"
      rm -rf "$DELETE_PATH"
      rm -rf "${DIR_PATH_PREFIX}$DELETE_PATH"
    fi
  done
  # Run Merchant custom linter
  CUSTOM_LINT_FILE="./src/cartridges/int_bolt_extensions/cartridge/scripts/merchant-custom/${MERCHANT_NAME}/.lint.json"
  if test -f "$CUSTOM_LINT_FILE"; then
    echo "====== Start Custom Merchant Linter ========="
    npx eslint --format unix --ext .jsx,.js --cache --cache-location node_modules/eslintcache/cache . --fix --config "$CUSTOM_LINT_FILE"
    npx babel ./src/cartridges -d ./cartridges --copy-files
    echo "====== End Custom Merchant Linter ========="
  else
    echo "No Custom Merchant Linter Found"
  fi
  # Zip the artifact into artifacts directory as v<TAG>-<MERCHANT_NAME>.zip
  zip -r ../artifacts/"$GIT_TAG-$MERCHANT_NAME".zip . -x ".git/*" "node_modules/*" ".circleci/*" "src/*"
  cd ../bolt-demandware || exit
  rm -rf "$MERCHANT_NAME:?x/"
}

# Create Artifacts directory
mkdir ../artifacts
for merchant in "${merchantList[@]}"; do
  cp -r . ../"$merchant"
  create_release "$merchant"
done

# Copy release script for the next build step
cp .circleci/scripts/release-artifacts.sh ../artifacts
