/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/*
 * API to get an identity to use in logging in or creating an account.
 *
 * Sometimes configuring app for full UI login flow is tricky (as IDPs validate
 * redirect URIs, app signing, etc). So in development mode you can set the ID info
 * directly by grabbing a token from utility pages on the IDP web site, and set
 * in a developer UI.
 *
 * ID providers need to be added at app startup before init() is called.
 */

import {AuthType, LoginCredential} from '@toolkit/core/api/Auth';

const IdentityService = {
  // Sets a provider. Will overwrite any existing providers for that type
  //
  // Note that providers are often platform / environment specific, so
  // apps may need a different config for web/mobile/Expo
  addProvider(provider: IdentityProvider) {
    _providers[provider.getType()] = provider;
  },

  init: async () => {
    for (const type in _providers) {
      await _providers[type].init();
    }
  },

  tryConnect: async (
    type: AuthType,
    product: string,
    scopes?: string[],
  ): Promise<LoginCredential> => {
    const devInfo = getDevIdentityInfo();

    if (devInfo && type === 'dev') {
      return devInfo;
    }

    const provider = _providers[type];
    const cacheKey = getCacheKey(type, product);
    let creds;

    if (provider) {
      creds = await provider.tryConnect(product, scopes || []);
      _cachedAuth[cacheKey] = creds;
    }

    creds = creds || _cachedAuth[cacheKey];

    if (!creds) {
      throw new Error(
        `No auth provider configured for auth type "${type}".` +
          'Can configure or call setAuthInfo() in dev mode.',
      );
    }

    return creds;
  },

  getAuthInfo: async (
    product: string,
    type: string,
  ): Promise<LoginCredential | null> => {
    const devInfo = getDevIdentityInfo();
    if (devInfo) {
      return devInfo;
    }
    const provider = _providers[type];
    const cacheKey = getCacheKey(type, product);
    if (provider) {
      const authInfo = await provider.getAuthInfo(product);
      if (authInfo) {
        _cachedAuth[cacheKey] = authInfo;
      }
    }

    return _cachedAuth[cacheKey];
  },

  // Sets the token for identity info in dev mode
  // Currently it's just one global that we use for all auth types
  devSetToken: async (token: string | null): Promise<void> => {
    _devAccessToken = token;
  },

  disconnect: async (product: string, type: string): Promise<void> => {
    const provider = _providers[type];
    const cacheKey = getCacheKey(type, product);
    if (provider) {
      await provider.disconnect(product);
    }
    delete _cachedAuth[cacheKey];
  },
};

const _providers: {[key: string]: IdentityProvider} = {};

// Cached auth state
const _cachedAuth: {[key: string]: LoginCredential | null} = {};

// Access token set in a developer UI
let _devAccessToken: string | null = null;

function getCacheKey(type: string, appId?: string): string {
  return type + ':' + (appId != null ? String(appId) : 'default');
}

function getDevIdentityInfo(): LoginCredential | null {
  // TODO: Return real values for userId and appId if they end up mattering
  return _devAccessToken != null
    ? {
        token: _devAccessToken,
        id: 'fake value',
        type: 'facebook',
      }
    : null;
}

/**
 * Generic API for identity providers. This won't work for all use cases, as some auth
 * providers require more customization in the API and calling style, but this interface
 * seems like it will cover at least all 3P identity providers and anonymous auth.
 *
 * Other notes:
 * - The access token returned below is only temporarily valid, and should be used to
 *   bootstrap a call to login or create an account with app-specific auth
 * - Caling tryConnect() after the user has connected their account with an app, even
 *   after logging out, will usually result in a login with no user interaction required.
 *   However a) it may show a popup or other UI temporarily, and b) It is always possible
 *   that FB will require logging back in.
 */

export type IdentityProvider = {
  // Initialize the identity provider
  init: () => Promise<void>;

  // Connect the app with the identity provider, possibly launching interactive UI.
  // Pomise may take a long time (5 minutes+) before returning.
  tryConnect: (product: string, scopes: string[]) => Promise<LoginCredential>;

  // Get identity info without launching UI
  getAuthInfo: (product: string) => Promise<LoginCredential | null>;

  // Disconnect from identity provider
  disconnect: (product: string) => Promise<void>;

  // Type of this provider
  getType: () => string;
};

export default IdentityService;
