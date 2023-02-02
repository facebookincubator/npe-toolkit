#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to format all the files in the repo

SCRIPTDIR=$(dirname $0)
BASEDIR=$(cd $SCRIPTDIR/../.. && echo $PWD)

echo Installing tools
cd $BASEDIR/tools/project && yarn install

echo Running prettier across the code base
yarn prettier -w $BASEDIR/**/*.{ts,tsx}
