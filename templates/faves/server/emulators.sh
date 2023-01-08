#!/bin/bash
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

OLD_CHECKSUM=$(cat functions/.runtimeconfig_checksum)
CURRENT_CHECKSUM=$(cksum functions/.runtimeconfig.json)
if [ "$OLD_CHECKSUM" != "$CURRENT_CHECKSUM" ] || [ ! -f "functions/.runtimeconfig.json" ]
then
  echo "Setting up runtime config..."
  firebase functions:config:get > functions/.runtimeconfig.json
  cksum functions/.runtimeconfig.json > functions/.runtimeconfig_checksum
fi

# Download this from https://console.firebase.google.com/u/0/project/npe-prototype-000/settings/serviceaccounts/adminsdk
export GOOGLE_APPLICATION_CREDENTIALS='../admin_sdk_key.json'
firebase emulators:start
