/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import * as React from 'react';
import {AppRegistry, Platform, YellowBox} from 'react-native';
import {AppConfig, registerAppConfig} from '@toolkit/core/util/AppConfig';

/* eslint-disable no-console */
function ignoreWebWarnings() {
  if (Platform.OS === 'web') {
    var methods = ['debug', 'warn', 'info', 'error'];
    for (var i = 0; i < methods.length; i++) {
      // @ts-ignore
      const logMethod = console[methods[i]];
      // @ts-ignore
      console[methods[i]] = function (...args) {
        for (const arg of args) {
          if (typeof arg === 'string' && ignore(arg)) {
            return;
          }
        }
        logMethod(...args);
      };
    }
  }
}

function ignore(msg: string) {
  for (const warning of IGNORE_WARNINGS) {
    if (msg.indexOf(warning) !== -1) {
      return true;
    }
  }
  return false;
}

// This is a bit of a misuse of app config, but simplified the process significantly
// for enabling dev URL overrides for www auth so seemed like a good tradeoff
const WWW_AUTH_CONFIG: AppConfig = {
  product: 'www_login',
  apiUrl: 'https://graph.fbnpeprojects.com',
  apiUrlFormatter: 'https://graph.${NUM}.od.fbnpeprojects.com',
};

// TODO: T68905555 Address these warnings
const IGNORE_WARNINGS = [
  'LogBox',
  'Require cycle',
  'has been extracted from react-native',
  'has been merged with',
  'session has expired',
  'Invalid DOM property',
  'Invalid props.style key `whiteSpace`',
];

let initialized = false;

export function initWeb(
  component: React.ComponentType<{}>,
  appInit?: () => void,
) {
  if (!initialized) {
    initialized = true;
    YellowBox.ignoreWarnings(IGNORE_WARNINGS);
    ignoreWebWarnings();
    appInit && appInit();
    registerAppConfig(WWW_AUTH_CONFIG);
    AppRegistry.registerComponent('Root', () => component);
    AppRegistry.runApplication('Root', {
      rootTag: document.getElementById('root'),
    });
  }
}
