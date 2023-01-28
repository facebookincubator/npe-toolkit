#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Checksum yarn.lock files for smoke test cache key

BASEDIR=$(cd $1 && echo $PWD)
echo Creating checksums at /tmp/tkchecksum.txt for $BASEDIR

shasum $BASEDIR/tools/smoketest/yarn.lock \
  $BASEDIR/templates/faves/project/yarn.lock \
  $BASEDIR/templates/faves/server/functions/yarn.lock \
  $BASEDIR/shell/latest/yarn.lock \
  $BASEDIR/shell/latest/server/yarn.lock > /tmp/tkchecksum.txt


