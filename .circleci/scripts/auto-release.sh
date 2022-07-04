#!/usr/bin/env bash

PREVREL=$(git for-each-ref --sort=-creatordate --format="%(refname:short)|%(creatordate:unix)" refs/tags/* | head -n 1)

taggedDate=$(echo $PREVREL | cut -d"|" -f2)
releaseCyclePeriod=$(date --date "10 days ago" +"%s")

if [[ ${taggedDate} -lt ${releaseCyclePeriod} ]]; then
  OLDTAGNAME=$(echo $PREVREL | cut -d"|" -f1)
  NEWTAGNAME=$(echo $OLDTAGNAME | awk -F. '{print $1 "." $2 "." $3+1}')

  echo $NEWTAGNAME

  curl -u ${CIRCLE_TOKEN}: -X POST --header "Content-Type: application/json" -d '{
  "parameters": {
    "tag": '"\""$NEWTAGNAME"\""',
    "run_release_workflow": true
  }
}' https://circleci.com/api/v2/project/gh/BoltApp/bolt-demandware/pipeline
else
  echo "No release this week"
  circleci-agent step halt
fi
