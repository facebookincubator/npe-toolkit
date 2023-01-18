/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');
const webpack = require('webpack');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const WebpackUtils = require('@npe-toolkit-tools/config/WebpackUtils');

WebpackUtils.testConsoleLog();

const CLIENTS = {
  main: {
    root: '../client',
    output: 'web-build',
  },
  admin: {
    root: '../admin',
    output: 'admin-build',
  },
};

// Set the client based on "CLIENT" environment variable, defaults to "main"
const client = CLIENTS[process.env.CLIENT || 'main'];
process.env.WEBPACK_BUILD_OUTPUT_PATH = client.output;

module.exports = async function (env, argv) {
  const config = await WebpackUtils.webpackWithLocalDeps(__dirname, env, argv);

  config.entry.app[1] = client.root;
  // This is useful initial web deployments, as it is
  // faster and JS is more debuggable. Should be removed for full launch.
  WebpackUtils.unoptimize(config);
  WebpackUtils.quitAfterBuild(config); // Expo CLI wasn't terminating after builds

  config.resolve.alias['react-native-webview'] = 'react-native-web-webview';

  // expo-firebase-recaptcha uses firebase v9 APIs in v8 interop mode
  // This converts it to use v8 directly
  config.resolve.alias['firebase/compat/app'] = 'firebase/app';
  config.resolve.alias['firebase/compat/auth'] = 'firebase/auth';

  config.module.exprContextCritical = false;

  // This is how you would override the index.html location
  // overrideWebDir(config, '../../apps/h2/client/web');

  return config;
};

function overrideWebDir(config, dir) {
  config.devServer.contentBase = dir;

  for (plugin of config.plugins) {
    if (
      plugin.options &&
      plugin.options.template &&
      plugin.options.scriptLoading
    ) {
      plugin.options.template = dir + '/index.html';
    }
  }
}
