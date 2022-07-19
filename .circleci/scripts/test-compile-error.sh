#!/bin/bash
ExpectedErrorCount=1
COMPILESUCCESS=$(npm run compile | grep "Error" | wc -l | xargs)

if [ "$COMPILESUCCESS" -eq "$ExpectedErrorCount" ]
then
    echo "npm run compile ran without errors"
else
    echo "error count: " $COMPILESUCCESS
    echo "npm run compile had errors"
    exit 1
fi
