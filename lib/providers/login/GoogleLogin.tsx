/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import 'firebase/auth';
import {useIdTokenAuthRequest} from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {IdentityProvider} from '@toolkit/core/api/Login';
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
      const [_, __, promptAsync] = useIdTokenAuthRequest(cfg);

      return async () => {
        const resp = await promptAsync();
        const responseType = resp?.type;
        if (responseType === 'success') {
          const token = resp.authentication?.idToken || resp.params?.id_token;
          if (token !== null) {
            return {type: 'google', token};
          }
        }
        const error =
          responseType === 'error'
            ? resp.error!
            : LoginError(`Google login failure: ${responseType}`);
        throw error;
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
