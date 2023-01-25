/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {Api, ApiKey, createApiKey} from '@toolkit/core/api/DataApi';
import {BOOL, useStored} from '@toolkit/core/client/Storage';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Opt} from '@toolkit/core/util/Types';
import {
  DEFAULT_FUNCTIONS_REGION,
  getFirebaseConfig,
  useFirebaseApp,
} from '@toolkit/providers/firebase/Config';
import 'firebase/functions';

// Change this to your local IP address when enabling emulation.
const EMULATOR_HOST = 'localhost';
const FIREBASE_FUNCTIONS_PORT = 5001;

const USE_EMULATOR_KEY = 'DEV.USE_EMULATOR';

export function useEmulator() {
  return useStored(USE_EMULATOR_KEY, BOOL, false);
}

export function useApi<I, O>(apiKey: ApiKey<I, O>): Api<I, O> {
  const firebaseConfig = getFirebaseConfig();
  const prefix = firebaseConfig.namespace ? firebaseConfig.namespace + '-' : '';
  // const [enableEmulator] = useStoredAsync(USE_EMULATOR_KEY, BOOL, false);

  return async (input?: I) => {
    const functions = useFirebaseApp().functions(
      firebaseConfig.defaultFunctionsRegion ?? DEFAULT_FUNCTIONS_REGION,
    );
    if (firebaseConfig.emulators?.functions?.useEmulator) {
      const emulatorConfig = firebaseConfig.emulators?.functions;
      functions.useEmulator(
        emulatorConfig?.host ?? EMULATOR_HOST,
        emulatorConfig?.port ?? FIREBASE_FUNCTIONS_PORT,
      );
    }

    try {
      const result = await functions.httpsCallable(prefix + apiKey.id)(input);
      return result.data as O;
    } catch (e: any) {
      throw toCodedError(e) || e;
    }
  };
}

const toCodedError = function (error: Error): Opt<CodedError> {
  const e: any = error;
  const {details} = e;
  // if thrown from server, `e.details` should have `CodedError`
  if (details && details.CodedError) {
    const codedError = new CodedError(
      details.CodedError.type,
      details.CodedError.userVisibleMessage,
      details.CodedError.devMessage,
    );
    codedError.stack = error.stack;
    return codedError;
  }
  return null;
};

export {Api, ApiKey, createApiKey};
