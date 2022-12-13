/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');
const {getLocalDependencies} = require('./PackageUtils');

// List of node modules that will be referenced always from the main app directory
const LOCAL_NODE_MODULES = [
  '@babel',
  '@expo',
  '@react-navigation',
  '@unimodules',
  'firebase',
  'libphonenumber-js',
  'moti',
  'nullthrows',
  'react',
  'react-dom',
  'react-native',
  'react-native-gesture-handler',
  'react-native-paper',
  'react-native-reanimated',
  'react-native-safe-area-context',
];

/**
 * Gets a jest config that works with libraries in remote directories.
 *
 * appDir is the __dirname of the caller
 *
 * jestExpoConfig param is created by caller:
 *   const jestExpoConfig = require('jest-expo/jest-preset');
 *   ...
 *   const config = JestUtils.jestWithLocalDeps(__dirname, jestExpoConfig);
 * (has to be created by caller to resolve libraries from app root)
 *
 * Local dependencies are read from localDependencies in package.json.
 * Format is "alias": "path", eg.g. "@npe/lib": "../../libraries/npe"
 *
 * Can override local dependencies using libsOverride arg.
 */
function jestWithLocalDeps(appDir, jestExpoConfig, libsOverride) {
  const libs = libsOverride || getLocalDependencies(appDir);

  // Map known libraries into root modules
  // (For projects with symlinked `dependencies`, tests worked without these mappers)
  const moduleNameMapper = {
    // Expo is the one special rule, as it matches modules of name expo-*
    '^expo($|/.+|-.+)': '<rootDir>/node_modules/expo$1',
  };
  LOCAL_NODE_MODULES.forEach(name => {
    moduleNameMapper[`^${name}($|/.+)`] = `<rootDir>/node_modules/${name}$1`;
  });

  for (const alias in libs) {
    // Maps ALIAS/(.*) to PATH/(.*)
    moduleNameMapper['^' + alias + '/(.*)'] = libs[alias] + '/$1';
  }

  return {
    ...jestExpoConfig,
    rootDir: appDir,
    // Default but with @expo-google-fonts added to the exclude list
    transformIgnorePatterns: [
      'node_modules/(?!((jest-)?react-native|moti|@ptomasroos.*|@expo-google-fonts|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
    ],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    moduleNameMapper,
  };
}

/**
 * Logs that are safe to suppress.
 */
const STANDARD_SUPPRESS_MATCHES = [
  'AsyncStorage has been extracted',
  'error boundary',
  'useNativeDriver',
];

/**
 * Suppresses logs matching any of the strings in matches.
 * Useful to clean up log output from expected warnings and errors,
 */
function suppressExpectedLogs(matches) {
  const toMatch = (matches ?? []).concat(STANDARD_SUPPRESS_MATCHES);

  function suppressErrors(fn) {
    function ignoreIfMatches(...args) {
      if (typeof args[0] === 'string') {
        for (const match of toMatch) {
          if (args[0].indexOf(match) !== -1) {
            return;
          }
        }
      }
      fn(...args);
    }
    return ignoreIfMatches;
  }

  global.console = {
    ...console,
    error: suppressErrors(global.console.error),
    warn: suppressErrors(global.console.warn),
    log: suppressErrors(global.console.log),
  };
}

module.exports = {
  jestWithLocalDeps,
  suppressExpectedLogs,
};
