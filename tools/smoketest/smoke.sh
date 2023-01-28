#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script smoketest the repo. Right now just does yarn install and tsc

BASEDIR=$(cd $1 && echo $PWD)
echo $BASEDIR
ls -ald
ls $BASEDIR
ls $BASEDIR/tools
ls $BASEDIR/tools/smoketest
ls tools


ln -snf $BASEDIR $BASEDIR/templates/npe-toolkit

echo Calling \`yarn install\` on all directories
cd $BASEDIR/tools/smoketest && yarn install
cd $BASEDIR/templates/faves/project && yarn install
cd $BASEDIR/templates/faves/server/functions && yarn install
cd $BASEDIR/shell/latest && yarn install
cd $BASEDIR/shell/latest/server && yarn install

echo Typechecking all directories
cd $BASEDIR/tools/smoketest
yarn tsc -p $BASEDIR/templates/faves/client --noEmit
yarn tsc -p $BASEDIR/templates/faves/admin --noEmit
yarn tsc -p $BASEDIR/templates/faves/server/functions --noEmit
yarn tsc -p $BASEDIR/shell/latest --noEmit


