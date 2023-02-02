#!/bin/bash
#
# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script to set up a new project directory

# Currently just verifies that there is a symlink at `/usr/local/lib/npe-toolkit`
# and prints a message to set up symlink if not

NPE_TOOLKIT_SYMLINK=../../npe-toolkit

if [[ ! -d $NPE_TOOLKIT_SYMLINK ]]; then
    echo ERROR: You need toe symlink npe-toolkit when using developer build
    echo "> ln -snf \$PATH_TO_NPE_TOOLKIT \$YOUR_APP_DIR/../npe-toolkit"
    exit 1
fi

yarn install
