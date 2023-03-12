/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import 'firebase/auth';
import {useIdTokenAuthRequest} from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {IdentityProvider} from '@toolkit/core/api/Login';
import {usePersistentPromise} from '@toolkit/core/client/PersistentPromise';
import {CodedErrorFor} from '@toolkit/core/util/CodedError';

const LoginError = CodedErrorFor('auth.login_fail', 'Error logging in');

WebBrowser.maybeCompleteAuthSession();

export type GoogleLoginConfig = {
  expoClientId?: string;
  iosClientId?: string;
  webClientId?: string;
};

export function googleAuthProvider(
  cfg: GoogleLoginConfig = {},
): IdentityProvider {
  // Expo and web can use same client ID, so use web if Expo not set
  cfg.expoClientId = cfg.expoClientId || cfg.webClientId;

  return {
    init: async () => {},

    useTryConnect: (product: string, scopes: string[]) => {
      const [_, fullResult, promptAsync] = useIdTokenAuthRequest(cfg);
      const {resolve, reject, newPromise} = usePersistentPromise();
      const authResult = React.useRef();

      if (fullResult !== null) {
        const token = fullResult?.params?.id_token;
        resolve({type: 'google', token: token});
      }

      return async () => {
        authResult.current = newPromise();
        const resp = await promptAsync();
        const responseType = resp?.type;
        if (responseType === 'success') {
          // Annoyingly, the response here doesn't include the idToken - have to
          // wait for the fullResult state to be set. So return a `PersistentPromise`
          // that can be fulfilled on the ref that is returned.
          return authResult.current;
        }
        const error =
          responseType === 'error'
            ? resp.error!
            : LoginError(`Google login failure: ${responseType}`);
        reject(error);
      };
    },

    getAuthInfo: async (product: string) => {
      return null;
    },

    disconnect: async (appId?: string) => {
      // TODO: Really disconnect
    },

    getType: () => 'google',
  };
}
