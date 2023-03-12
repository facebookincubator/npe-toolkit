#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to yarn install all directories in the toolkit

SCRIPTDIR=$(dirname $0)
BASEDIR=$(cd $SCRIPTDIR/../.. && echo $PWD)

echo Calling \`yarn install\` on all directories
cd $BASEDIR && yarn install
cd $BASEDIR/tools/project && yarn install
cd $BASEDIR/shell/latest && yarn install
cd $BASEDIR/shell/latest/server && yarn install
