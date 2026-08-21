#!/usr/bin/env bash

# TODO: Modify this to run integration tests against embedded cartridges. Currently this is for V1 managed checkout tests
curl -u ${CIRCLE_TOKEN}: -X POST --header "Content-Type: application/json" -d '{
  "parameters": {
    "run_sfra_integration_tests": true,
    "run_base_tests": false,
    "remote_wdio_config_type": "localChrome"
  }
}' https://circleci.com/api/v2/project/gh/BoltApp/integration-tests/pipeline

