/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');
const {getLocalDependencies} = require('./PackageUtils');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

/**
 * Produce a single file for JS output.
 *
 * Useful for current www deployments where we only host a single JS file.
 */
function dontSplit(config) {
  if (config.optimization) {
    delete config.optimization.splitChunks;
    config.optimization.runtimeChunk = false;
  }
  config.output.filename = 'static/js/[name].js';
}

/**
 * Web builds processes weren't terminating on FB unix-based servers
 * (ondemand/devserver/Sandcastles).
 *
 * This quits the process after build if you run
 * `> BUILD=1 yarn expo  CMD`
 */
function quitAfterBuild(config) {
  // Use `BUILD=1 yarn expo CMD` to trigger command in "BUILD" mode
  if (process.env.BUILD) {
    config.plugins.push({
      apply: compiler => {
        compiler.hooks.done.tap('DonePlugin', () => process.exit(0));
      },
    });
  }
}

/**
 * Optimizing web builds adds 10-20s to production builds,
 * and often makes sense to disable during early development.
 */
function unoptimize(config) {
  if (config.optimization) {
    config.optimization.minimize = false;
  }

  for (plugin of config.plugins) {
    if (
      plugin.options &&
      plugin.options.minify &&
      plugin.options.minify.useShortDoctype
    ) {
      delete plugin.options.minify;
    }
  }
}

/**
 * List of NPM packages for which to set babel `dangerouslyAddModulePathsToTranspile`
 * flag in env.
 *
 * At least one package requires this to function correctly on web: https://moti.fyi/web
 *
 * Using in all cases (even if app doesn't have NPM dep), because it it a
 * no-op if you're not using the NPM depenedency.
 */
const STD_TRANSPILATION_PACKAGES = ['moti'];

/**
 * Gets a webpack config that works with libraries in remote directories.
 *
 * appDir is __dirname for the caller
 * env and argv are values passed into webpack.config.js
 *
 * Local dependencies are read from localDependencies in package.json.
 * Format is "alias": "path", eg.g. "@npe/lib": "../../libraries/npe"
 *
 * Can override local dependencies using libsOverride arg.

 */
async function webpackWithLocalDeps(appDir, env, argv, libsOverride) {
  const libs = libsOverride || getLocalDependencies(appDir);
  const libDirs = Object.values(libs);

  // Recipe via https://github.com/expo/examples/issues/264
  const myEnv = {
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: [
        ...libDirs,
        ...STD_TRANSPILATION_PACKAGES,
      ],
    },
  };

  const config = await createExpoWebpackConfigAsync(myEnv, argv);
  config.resolve.symlinks = false;

  // Ensure node modules still resolve
  config.resolve.modules = [path.resolve(appDir, 'node_modules')];

  config.resolve.alias = {};
  for (alias in libs) {
    config.resolve.alias[alias] = libs[alias];
  }

  return config;
}

/**
 * Common developer-mode configuration
 */
function devServerSetup(config) {
  if (config.mode === 'development') {
    // Splitting files speeds up reloads as only small chunk of app JS code changes
    config.optimization = {
      splitChunks: {chunks: 'all', name: false},
      runtimeChunk: true,
    };

    // Poll option is needed to recompile on hg changes on devservers/OD
    config.devServer = config.devServer || {};
    config.devServer.watchOptions = config.devServer.watchOptions || {};
    config.devServer.watchOptions.poll = 1000;
  }
}

/**
 * Test command, useful for verifying that the library is
 * being loaded correctly.
 */
function testConsoleLog() {
  console.log('--- WebpackUtils successfully loaded ---');
}

module.exports = {
  dontSplit,
  quitAfterBuild,
  webpackWithLocalDeps,
  testConsoleLog,
  unoptimize,
  devServerSetup,
};
