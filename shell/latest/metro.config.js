/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

const MetroUtils = require('@npe/config/MetroUtils');
const { getDefaultConfig } = require('expo/metro-config');

module.exports = MetroUtils.metroWithLocalDeps(__dirname, getDefaultConfig(__dirname));
