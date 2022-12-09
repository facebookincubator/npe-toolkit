/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');
const {getDefaultConfig} = require('expo/metro-config');
const {getLocalDependencies} = require('./PackageUtils');

// `hax-app` derative apps use "react-native:0.63.4, metro-config:0.59.0" but
// `peridot` is on newer "react-native:0.64.1, metro-config:0.64.0"
let exclude;
try {
  exclude = require('metro-config/src/defaults/blacklist');
} catch (e) {
  exclude = require('metro-config/src/defaults/exclusionList');
}

/**
 * Gets a metro config that works with libraries in remote directories.
 *
 * appDir is the __dirname of the caller
 *
 * config param is created by caller:
 *   const { getDefaultConfig } = require('expo/metro-config');
 *   ...
 *   getDefaultConfig(__dirname)
 * Hss to be created by caller the working directory is used (true?)
 *
 * Local dependencies are read from localDependencies in package.json.
 * Format is "alias": "path", eg.g. "@npe/lib": "../../libraries/npe"
 *
 * Can override local dependencies using libsOverride arg.

 */
async function metroWithLocalDeps(appDir, config, libsOverride) {
  const libs = libsOverride || getLocalDependencies(appDir);
  const libDirs = Object.values(libs);

  config.watchFolders = [...libDirs, appDir];

  // Adds library to modules and also resolves node_modules to current directory
  const MODULE_RESOLVER = new Proxy(
    {},
    {
      get: (target, name) => {
        for (alias in libs) {
          if (name.indexOf(alias) === 0) {
            return name.replace(alias, libs[alias]);
          }
        }
        return `${appDir}/node_modules/${name}`;
      },
    },
  );

  config.resolver.extraNodeModules = MODULE_RESOLVER;
  config.resolver.blacklistRE = exclude([/.*\/typecheck\/.*/]);
  return config;
}

module.exports = {
  metroWithLocalDeps,
};
