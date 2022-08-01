#!/usr/bin/env bash

GIT_TAG=$1

echo "The following version will be released:"
echo "$GIT_TAG"

# Create release artifacts
create_release() {
  pwd
  
  # Zip the artifact into artifacts directory as v<TAG>.zip
  zip -r ../artifacts/"$GIT_TAG".zip . -x ".git/*" "node_modules/*" ".circleci/*"
  cd ../bolt-demandware-embedded || exit
}

# Create Artifacts directory
mkdir ../artifacts
create_release


# Copy release script for the next build step
cp .circleci/scripts/release-artifacts.sh ../artifacts
