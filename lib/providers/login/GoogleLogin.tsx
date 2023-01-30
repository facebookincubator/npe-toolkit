/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as GoogleSignIn from 'expo-google-sign-in';
import firebase from 'firebase/app';
import 'firebase/auth';
import {Platform} from 'react-native';
import {IdentityProvider} from '@toolkit/core/api/Login';
import {CodedErrorFor} from '@toolkit/core/util/CodedError';

const {GoogleAuthProvider} = firebase.auth;
type OAuthCredential = firebase.auth.UserCredential & {
  idToken: string;
  accessToken: string;
};

const LoginError = CodedErrorFor('auth.login_fail', 'Error logging in');

type GoogleAuthConfig = {
  webClientId?: string;
};

export function googleAuthProvider(cfg?: GoogleAuthConfig): IdentityProvider {
  return {
    init: async () => {},

    tryConnect: async (product: string, scopes: string[]) => {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        for (const scope of scopes) {
          provider.addScope(scope);
        }
        const result = await firebase.auth().signInWithPopup(provider);
        const cred = result.credential as OAuthCredential | null;
        const idToken = cred?.idToken;

        if (!idToken) {
          throw LoginError();
        }

        return {
          type: 'google',
          id: result.user?.uid,
          token: idToken,
        };
      } else {
        await GoogleSignIn.initAsync({
          scopes,
          webClientId: cfg?.webClientId,
        });
        const result = await GoogleSignIn.signInAsync();

        if (result.type === 'success') {
          const {idToken} = result.user?.auth!;
          if (idToken == null) {
            // TODO: More specific errors
            throw LoginError();
          }
          // TODO: Real ID
          return {type: 'google', id: result.user?.uid, token: idToken};
        } else {
          throw LoginError();
        }
      }
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
