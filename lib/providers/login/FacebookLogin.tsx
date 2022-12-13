/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// TODO Implement FB Login using Expo (the commented out sections)

import * as Facebook from 'expo-facebook';
import {getAppConfig} from '@toolkit/core/util/AppConfig';
import {IdentityProvider} from '@toolkit/core/api/Login';

export function fbAuthProvider(): IdentityProvider {
  return {
    init: async () => {},

    tryConnect: async (product: string, scopes: string[]) => {
      const fbAppId = getAppConfig(product).fbAppId ?? '';
      await Facebook.initializeAsync({appId: fbAppId});
      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: scopes,
      });
      if (result.type === 'cancel') {
        // TODO: Make this a real error
        throw Error('User cancelled');
      }
      return {
        type: 'facebook',
        token: result.token,
        id: result.userId,
      };
    },

    getAuthInfo: async (product: string) => {
      const fbAppId = getAppConfig(product).fbAppId ?? '';
      const result = await Facebook.getAuthenticationCredentialAsync();
      if (result == null) {
        return null;
      }

      return {
        type: 'facebook',
        token: result.token,
        id: result.userId,
      };
    },

    disconnect: async (appId?: string) => {
      // TODO: T81938996 Really disconnect from FB auth
      throw Error('not implemented on Expo yet');
    },

    getType: () => 'facebook',
  };
}
