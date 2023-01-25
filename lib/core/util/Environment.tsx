/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Platform} from 'react-native';
import {CodedError} from '@toolkit/core/util/CodedError';

const KNOWN_SUPRIOUS_ERRORS = [
  'React does not recognize the `%s` prop on a DOM element',
  'development build of the Firebase JS SDK',
  'native animated module is missing',
];

function shouldSuppress(e: Error | string) {
  if (e instanceof CodedError) {
    return true;
  }

  const msg = typeof e === 'string' ? e : e.message;
  for (const known of KNOWN_SUPRIOUS_ERRORS) {
    if (msg && msg.indexOf(known) !== -1) {
      return true;
    }
  }
  return false;
}

function filterConsole(method: string, filter: (e: Error) => boolean) {
  const consoleCopy: any = console;
  const wrapped = consoleCopy[method];
  consoleCopy[method] = (e: Error, ...args: any) => {
    if (shouldSuppress(e)) {
      return;
    }
    wrapped(e, ...args);
  };
}

/**
 * Patches the React Native developer error UI to filter out CodedErrors,
 * which we handle in the app and are part of non-error cases (e.g. logging out)
 */
export function filterHandledExceptions() {
  if (Platform.OS === 'web') {
    window.addEventListener('error', e => {
      let {error} = e;
      if (shouldSuppress(error)) {
        e.preventDefault();
        return false;
      }
      return true;
    });

    filterConsole('error', shouldSuppress);
    filterConsole('warn', shouldSuppress);

    const ErrorOverlay = require('react-error-overlay');
    try {
      ErrorOverlay.stopReportingRuntimeErrors();
    } catch (ignored) {
      // This throws in production builds (as reporting won't have started)
      // and can safely be ignored
    }
  } else {
    const exceptionMgrPackage = 'react-native/Libraries/Core/ExceptionsManager';
    const ExceptionsManager = require(exceptionMgrPackage);
    if (ExceptionsManager) {
      const wrappedHandler = ExceptionsManager.handleException;
      ExceptionsManager.handleException = (e: any, isFatal: boolean) => {
        if (e instanceof CodedError) {
          return;
        }
        return wrappedHandler(e, isFatal);
      };
    }
  }
}
