/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const fs = require('fs');

// Recursively find all local deps
function getLocalDependencies(appDir) {
  function helper(prodDir, localDependenciesSoFar) {
    // There are projects incorrectly set local deps (to inner folders) without package.json
    const packageJsonFile = prodDir + '/package.json';
    if (!fs.existsSync(packageJsonFile)) {
      console.log(`${packageJsonFile} not found. Ignore`);
      return;
    }
    const packageJson = require(packageJsonFile);
    const thisLocalDependencies = {
      ...getPkgLocalDepsLegacy(packageJson),
      ...getPkgLocalDeps(packageJson),
    };
    Object.keys(thisLocalDependencies).forEach(key => {
      if (key in localDependenciesSoFar) return;
      const thisPath = thisLocalDependencies[key];
      localDependenciesSoFar[key] = path.resolve(prodDir, thisPath);
      helper(localDependenciesSoFar[key], localDependenciesSoFar);
    });
  }
  const localDeps = {};
  helper(appDir, localDeps);
  return localDeps;
}

function getPkgLocalDepsLegacy(packageJson) {
  return packageJson.localDependencies || {};
}

function getPkgLocalDeps(packageJson) {
  const localDeps = {};
  if (!packageJson.dependencies) {
    return localDeps;
  }
  for (const [key, value] of Object.entries(packageJson.dependencies)) {
    if (value.startsWith('link:')) {
      localDeps[key] = value.substring(5);
    }
  }
  return localDeps;
}

module.exports = {
  getLocalDependencies,
};
