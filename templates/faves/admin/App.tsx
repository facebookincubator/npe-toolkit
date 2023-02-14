/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React, {Suspense} from 'react';
import {Ionicons, MaterialCommunityIcons, Octicons} from '@expo/vector-icons';
import {DefaultTheme, Provider as PaperProvider} from 'react-native-paper';
import IdentityService from '@toolkit/core/api/Login';
import {SimpleUserMessaging} from '@toolkit/core/client/UserMessaging';
import {AppContextProvider} from '@toolkit/core/util/AppContext';
import {filterHandledExceptions} from '@toolkit/core/util/Environment';
import {initializeFirebase} from '@toolkit/providers/firebase/Config';
import {FIRESTORE_DATASTORE} from '@toolkit/providers/firebase/DataStore';
import {googleAuthProvider} from '@toolkit/providers/login/GoogleLogin';
import {Icon, registerIconPack} from '@toolkit/ui/components/Icon';
import {usePaperComponents} from '@toolkit/ui/components/Paper';
import AuthConfig from '@app/admin/app/AuthConfig';
import DrawerNavigator from '@app/admin/app/DrawerNavigator';
import {FIREBASE_CONFIG, GOOGLE_LOGIN_CONFIG} from '@app/common/Config';
import {APP_CONFIG, APP_INFO} from './lib/Config';

function initIcons() {
  registerIconPack('ion', Ionicons);
  registerIconPack('oct', Octicons);
  registerIconPack('mci', MaterialCommunityIcons);
}

filterHandledExceptions();

export default function AppShell() {
  const APP_CONTEXT = [FIRESTORE_DATASTORE, APP_CONFIG, APP_INFO];
  initializeFirebase(FIREBASE_CONFIG);
  initIcons();
  usePaperComponents();
  IdentityService.addProvider(googleAuthProvider(GOOGLE_LOGIN_CONFIG));

  const theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      primary: '#618BB3',
      accent: '#EFA42F',
    },
  };

  return (
    <AppContextProvider ctx={APP_CONTEXT}>
      <PaperProvider theme={theme} settings={{icon: Icon}}>
        <Suspense fallback={null}>
          <SimpleUserMessaging style={{bottom: 100}} />
          <AuthConfig>
            <DrawerNavigator />
          </AuthConfig>
        </Suspense>
      </PaperProvider>
    </AppContextProvider>
  );
}
