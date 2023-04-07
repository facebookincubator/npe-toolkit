/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const fs = require('fs');
const {getDefaultConfig} = require('expo/metro-config');
const {getLocalDependencies} = require('./PackageUtils');

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

  for (const alias in libs) {
    libs[alias] = fs.realpathSync(libs[alias]);
  }

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
