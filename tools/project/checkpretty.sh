#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to verify formatting for all files in the repo

SCRIPTDIR=$(dirname $0)
BASEDIR=$(cd $SCRIPTDIR/../.. && echo $PWD)

echo Installing tools
cd $BASEDIR/tools/project && yarn install

echo Checking results of prettier
yarn prettier -l $BASEDIR/**/*.ts*

STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo "Apologies we're keeping the code always formatted." && \
  echo  "You'll need to run \`tools/project/prettify.sh\`"
  exit 1
fi
