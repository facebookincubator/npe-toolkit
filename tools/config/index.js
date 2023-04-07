/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const WebpackUtils = require('./WebpackUtils');

function getXplat() {
  const xplatMatch = '/fbsource/xplat/';
  return __dirname.split(xplatMatch)[0] + xplatMatch;
}

module.exports = {
  WebpackUtils,
};
