/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const MetroUtils = require('@npe-toolkit-tools/config/MetroUtils');
const { getDefaultConfig } = require('expo/metro-config');

module.exports = MetroUtils.metroWithLocalDeps(__dirname, getDefaultConfig(__dirname));
