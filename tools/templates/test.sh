#!/bin/bash
# Script to test running templates

UUID=$(uuidgen)
TRASH_DIR=~/.Trash/$UUID
TEMPLATE_DIR=../../templates/faves
APP_NAME=test-app

mkdir $TRASH_DIR

function removeDir() {
    if [[ -d $1 ]]; then
        echo Moving generated files to trash: $1
        mv $1 $TRASH_DIR/$2
    fi
}

echo ---\\nRemoving previous installation \(if any\)\\n---
removeDir $APP_NAME $APP_NAME
removeDir $TEMPLATE_DIR/project/node_modules node_modules
removeDir $TEMPLATE_DIR/project/.expo .expo

# TODO: Configure toolkit path with environment variable, e.g. TK=path/to/tk
# DEBUG env variable turns on debugging for `create-expo-app`
DEBUG=expo:init:template yarn create expo-app $APP_NAME -t $TEMPLATE_DIR

# There appears to be a bug in
# https://github.com/expo/expo-cli/blob/main/packages/create-expo-app/src/utils/git.ts
# that initializes new git setup, even when already in a repo.
rm -rf $APP_NAME/.git
