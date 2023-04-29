#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Clean all of the generated files in the repo

SCRIPTDIR=$(dirname $0)
BASEDIR=$(cd $SCRIPTDIR/../.. && echo $PWD)

echo Clearing all generated files
rm -rf $BASEDIR/node_modules
rm -rf $BASEDIR/tools/project/node_modules
rm -rf $BASEDIR/templates/faves/project/node_modules
rm -rf $BASEDIR/templates/faves/server/functions/node_modules
rm -rf $BASEDIR/deps/v47/node_modules
rm -rf $BASEDIR/deps/v47/server/node_modules
rm -rf $BASEDIR/deps/v47/ios/Pods
