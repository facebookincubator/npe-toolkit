#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script smoketest the repo. Right now just does yarn install and tsc

ROOT=$(cd $PWD/../../ && echo $PWD)
echo $ROOT
ls

ln -snf $ROOT $ROOT/templates/npe-toolkit

echo Calling \`yarn install\` on all directories
cd $ROOT/tools/smoketest && yarn install
cd $ROOT/templates/faves/project && yarn install
cd $ROOT/templates/faves/server/functions && yarn install
cd $ROOT/shell/latest && yarn install
cd $ROOT/shell/latest/server && yarn install

echo Typechecking all directories
cd $ROOT/tools/smoketest
yarn tsc -p $ROOT/templates/faves/client --noEmit
yarn tsc -p $ROOT/templates/faves/admin --noEmit
yarn tsc -p $ROOT/templates/faves/server/functions --noEmit
yarn tsc -p $ROOT/shell/latest --noEmit


