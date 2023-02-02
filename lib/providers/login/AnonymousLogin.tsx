/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {AuthType} from '@toolkit/core/api/Auth';
import {IdentityProvider} from '@toolkit/core/api/Login';
import {STRING, getStored, setStored} from '@toolkit/core/client/Storage';
import {uuidv4} from '@toolkit/core/util/Util';

const CLIENT_UUID_KEY = 'client_uuid';

function getKey(product: string, key: string) {
  return `${product}:${key}`;
}

// Anonymout auth provider just returns a token that is the anonymous client UUID
export function anonAuthProvider(): IdentityProvider {
  async function getAuthInfo(product: string) {
    let uuid = await getStored(getKey(product, CLIENT_UUID_KEY), STRING, null);
    if (uuid == null) {
      uuid = uuidv4();
      setStored(getKey(product, CLIENT_UUID_KEY), STRING, uuid);
    }
    const type: AuthType = 'anon';
    return {token: uuid, id: uuid, type};
  }

  return {
    init: async () => {},

    useTryConnect: (product: string, scopes: string[]) => {
      return async () => {
        return getAuthInfo(product);
      };
    },

    getAuthInfo: async (product: string) => {
      return getAuthInfo(product);
    },

    disconnect: async (product: string) => {
      await setStored(getKey(product, CLIENT_UUID_KEY), STRING, null);
    },

    getType: (): AuthType => 'anon',
  };
}

export async function devSetAnonymousClientId(uuid: string, product: string) {
  await setStored(getKey(product, CLIENT_UUID_KEY), STRING, uuid);
}
