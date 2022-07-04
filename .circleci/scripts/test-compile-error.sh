#!/bin/bash
ZERO=0
COMPILESUCCESS=$(npm run compile | grep "Error" | wc -l | xargs)

if [ $COMPILESUCCESS = $ZERO ]
then
    echo "npm run compile ran without errors"
else
    echo "npm run compile had errors"
    exit 1
fi
