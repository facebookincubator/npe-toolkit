#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

OLD_CHECKSUM=$(cat .runtimeconfig_checksum)
CURRENT_CHECKSUM=$(cksum .runtimeconfig.json)
if [ "$OLD_CHECKSUM" != "$CURRENT_CHECKSUM" ] || [ ! -f ".runtimeconfig.json" ]
then
  echo "Setting up runtime config..."
  firebase functions:config:get > .runtimeconfig.json
  cksum functions/.runtimeconfig.json > .runtimeconfig_checksum
fi

# Download this from Firebase Console, `Settings icon > Service Accounts tab`
export GOOGLE_APPLICATION_CREDENTIALS=$HOME/.secrets/day-tripper.json
yarn firebase emulators:start --only functions $1 $2
