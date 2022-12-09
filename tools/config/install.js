#!/usr/bin/env node
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 */

const {getLocalDependencies} = require('./PackageUtils');
const {exec, spawnSync, spawn} = require('child_process');
const fs = require('fs');

function xplat() {
  const xplatMatch = '/fbsource/xplat';
  return __dirname.split(xplatMatch)[0] + xplatMatch;
}

const XPLAT = xplat();

function sendToConsole(obj, isErr) {
  if (!obj) {
    return;
  }
  let str = obj.toString();
  str = str.replace(/\n$/, '');
  isErr ? console.error(str) : console.log(str);
}

function execCmd(cmdline) {
  return new Promise((resolve, reject) => {
    var cmd = spawn(cmdline, [], {shell: true});
    cmd.stdout.on('data', log => sendToConsole(log));
    cmd.stderr.on('data', log => sendToConsole(log, true));
    cmd.on('close', code => resolve());
  });
}

async function yarnInstallForDependencies() {
  const libraries = getLocalDependencies(process.env.INIT_CWD);
  libraries['@npe/config'] = `${XPLAT}/npe/tools/config`;
  for (alias of Object.keys(libraries)) {
    console.log(`Executing yarn install for "${alias}"`);
    const packageJsonFile = libraries[alias] + '/package.json';
    if (fs.existsSync(packageJsonFile)) {
      await execCmd(`yarn install --cwd ${libraries[alias]}`);
    }
    const optTypecheckDir = libraries[alias] + '/typecheck';
    if (fs.existsSync(optTypecheckDir)) {
      await execCmd(
        `yarn install --cwd ${optTypecheckDir} --modules-folder ${optTypecheckDir}/.node_modules`,
      );
    }
  }
  console.log('Finished installing dependencies\n');
}

yarnInstallForDependencies();
