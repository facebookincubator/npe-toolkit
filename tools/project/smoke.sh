#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to smoke test the entire repo. Right now just does yarn install and tsc

SCRIPTDIR=$(dirname $0)
BASEDIR=$(cd $SCRIPTDIR/../.. && echo $PWD)
ln -snf $BASEDIR $BASEDIR/templates/npe-toolkit

echo Calling \`yarn install\` on all directories
cd $BASEDIR && yarn install
cd $BASEDIR/tools/project && yarn install
cd $BASEDIR/templates/faves/project && yarn install
cd $BASEDIR/templates/faves/server/functions && yarn install
cd $BASEDIR/shell/latest && yarn install
cd $BASEDIR/shell/latest/server && yarn install

echo Typechecking all directories
STATUS=0
cd $BASEDIR/tools/project

yarn tsc -p $BASEDIR/templates/faves/client --noEmit
STATUS=$(($STATUS + $?))
yarn tsc -p $BASEDIR/templates/faves/admin --noEmit
STATUS=$(($STATUS + $?))
yarn tsc -p $BASEDIR/templates/faves/server/functions --noEmit
STATUS=$(($STATUS + $?))
yarn tsc -p $BASEDIR/shell/latest --noEmit
STATUS=$(($STATUS + $?))

echo Status: $STATUS
if [ $STATUS -ne 0 ]; then
  echo "Failure in typechecking. See logs above to find errors and fix.." && \
  echo  "To run locally, call \`tools/project/smoke.sh\`"
  exit 1
fi