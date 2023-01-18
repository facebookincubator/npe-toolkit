/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const JestUtils = require('@npe/config/JestUtils');

module.exports = JestUtils.jestWithLocalDeps(__dirname, {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', '<rootDir>/lib'],
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
});
