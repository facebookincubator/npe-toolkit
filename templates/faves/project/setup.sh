#!/bin/bash
# Script to set up a new project directory

# Currently just verifies that there is a symlink at `/usr/local/lib/npe-toolkit`
# and prints a message to set up symlink if not

NPE_TOOLKIT_SYMLINK=/usr/local/lib/npe-toolkit

if [[ ! -d $NPE_TOOLKIT_SYMLINK ]]; then
    echo ERROR: You need to symlink npe-toolkit when using developer build
    echo "> ln -s path_to_toolkit /usr/local/lib/npe-toolkit"
    exit 1
fi

yarn install