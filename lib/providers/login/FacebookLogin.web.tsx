/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {LoginCredential} from '@toolkit/core/api/Auth';
import {IdentityProvider} from '@toolkit/core/api/Login';
import {getAppConfig} from '@toolkit/core/util/AppConfig';

// Defaults to native, can be overridden in web
export function fbAuthProvider(): IdentityProvider {
  // TODO: Web login doesn't work with http:// URLs - possibly we should
  // disable and have a nice warning message explaining how to test
  return {
    init: async () => {
      // TODO: Reject if this takes too long
      return new Promise((resolve, reject) => {
        // Note: Logic copied from ForecastFBJSSDKInitializer
        // @ts-ignore
        window.fbAsyncInit = function () {
          resolve();
        };

        (function (doc, script, id) {
          const facebookJS = doc.getElementsByTagName(script)[0];
          if (doc.getElementById(id)) {
            return;
          }
          const jsElement = doc.createElement(script);
          jsElement.id = id;
          // @ts-ignore
          jsElement.src = 'https://connect.facebook.net/en_US/sdk.js';
          if (facebookJS.parentNode != null) {
            facebookJS.parentNode.insertBefore(jsElement, facebookJS);
          }
        })(document, 'script', 'facebook-jssdk');
      });
    },

    useTryConnect: (product: string, scopes: string[]) => {
      return async () => {
        return new Promise((resolve, reject) => {
          // @ts-ignore
          const fb = window.FB;
          if (!fb) {
            throw new Error('Must init FB SDK to use FB web auth.');
          }
          const fbAppId = getAppConfig(product).fbAppId;
          fb.init({
            appId: fbAppId,
            version: 'v8.0',
          });

          // @ts-ignore
          fb.login(async resp => {
            if (resp.authResponse) {
              resolve({
                type: 'facebook',
                token: resp.authResponse.accessToken,
                id: resp.authResponse.userID,
              });
            }
            reject(new Error('Login attempt failed'));
          });
        });
      };
    },

    getAuthInfo: async (product: string): Promise<LoginCredential | null> => {
      return null;
    },

    disconnect: async (product: string) => {},

    getType: () => 'facebook',
  };
}
