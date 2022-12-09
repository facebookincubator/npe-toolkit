/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
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
