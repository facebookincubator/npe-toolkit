/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');
const webpack = require('webpack');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const WebpackUtils = require('@npe/config/WebpackUtils');

WebpackUtils.testConsoleLog();

module.exports = async function (env, argv) {
  const config = await WebpackUtils.webpackWithLocalDeps(__dirname, env, argv);

  // This is useful initial web deployments, as it is
  // faster and JS is more debuggable. Should be removed for full launch.
  WebpackUtils.unoptimize(config);
  WebpackUtils.quitAfterBuild(config); // Expo CLI wasn't terminating after builds

  config.resolve.alias['react-native-webview'] = 'react-native-web-webview';

  config.module.exprContextCritical = false;

  return config;
};
