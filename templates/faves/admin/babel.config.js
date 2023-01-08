/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      'babel-plugin-transform-typescript-metadata',
      ['@babel/plugin-proposal-decorators', {version: 'legacy'}],
      ['@babel/plugin-proposal-class-properties', {loose: true}],
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
