#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to test running templates

yarn tsc --noEmit -p ../../templates/faves/client # | grep error
yarn tsc --noEmit -p ../../templates/faves/admin # | grep error
yarn tsc --noEmit -p ../../templates/faves/server/functions # | grep error
yarn tsc --noEmit -p ../../lib # | grep error