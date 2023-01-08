/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
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
