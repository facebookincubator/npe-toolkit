#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script smoketest the repo. Right now just does yarn install and tsc

SCRIPTDIR=$(dirname $0)
BASEDIR=$(cd $SCRIPTDIR/../.. && echo $PWD)

echo Installing tools
cd $BASEDIR/tools/smoketest && yarn install

echo Checking results of prettier
yarn prettier -l $BASEDIR/**/*.ts*

STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo "Apologies we're keeping the code always formatted." && \
  echo  "You'll need to run \`cd tools/smoketest && sh prettify.sh\`"
  exit 1
fi
