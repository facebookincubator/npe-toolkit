#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Warning to let you know you need to run an app shell
# This will go away once we switch to Expo Go

BLUE='\033[0;35m'
NO_COLOR='\033[0m'

echo -e ${BLUE}To run the app, you\'ll also need to run the iOS shell
echo -e See steps @ https://github.com/facebookincubator/npe-toolkit#running-on-ios${NO_COLOR}
