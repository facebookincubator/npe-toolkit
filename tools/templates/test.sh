#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to test running templates

UUID=$(uuidgen)
TRASH_DIR=~/.Trash/$UUID
TEMPLATE_DIR=../../templates/faves
APP_NAME=test-app
NPE_TOOLKIT_SYMLINK=/usr/local/lib/npe-toolkit

mkdir $TRASH_DIR

function removeDir() {
    if [[ -d $1 ]]; then
        echo Moving generated files to trash: $1
        rm -rf $1
    fi
}

echo --- Removing previous installation \(if any\) ---
removeDir $APP_NAME $APP_NAME
removeDir $TEMPLATE_DIR/project/node_modules node_modules
removeDir $TEMPLATE_DIR/project/.expo .expo
echo --- End removing previous installation ---

if [[ ! -d $NPE_TOOLKIT_SYMLINK ]]; then
    echo Symlinking toolkit to the root of this NPE Toolkit dev tree
    sudo ln -s $(readlink -f ../../) $NPE_TOOLKIT_SYMLINK
fi

# Note: Prefix with `DEBUG=expo:init:template` to turn on debugging for `create-expo-app`
yarn create expo-app $APP_NAME -t $TEMPLATE_DIR

# There appears to be a bug in
# https://github.com/expo/expo-cli/blob/main/packages/create-expo-app/src/utils/git.ts
# that initializes new git setup, even when already in a repo.
rm -rf $APP_NAME/.git
