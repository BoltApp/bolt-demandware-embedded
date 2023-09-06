#!/bin/bash
ZERO=0
UPLOADSUCCESS=$(npm run upload:all | npm run upload:sfra_ppc | grep "Error" | wc -l | xargs)

if [ $UPLOADSUCCESS = $ZERO ]
then
    echo "Cartridge upload success!"
else
    echo "Failed to upload cartridges!"
    exit 1
fi
