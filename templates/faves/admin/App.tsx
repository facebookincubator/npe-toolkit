/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React, {Suspense} from 'react';
import {DefaultTheme, Provider as PaperProvider} from 'react-native-paper';

import {googleAuthProvider} from '@npe/lib/auth/NPEGoogleAuthProvider';
import IdentityService from '@npe/lib/auth/NPEIdentityService';
import {FIRESTORE_DATASTORE} from '@npe/lib/firebase/FirestoreDataStoreProvider';
import {SimpleUserMessaging} from '@npe/lib/ui/UserMessaging';
import {AppContextProvider} from '@npe/lib/util/NPEAppContext';
import {Icon, registerIconPack} from '@npe/lib/ui/Icon';
import {filterHandledExceptions} from '@npe/lib/util/Environment';
import {Ionicons, MaterialCommunityIcons, Octicons} from '@expo/vector-icons';

import {APP_CONFIG, APP_INFO} from './lib/Config';
import {initializeFirebase} from './lib/Firebase';

import AuthConfig from './app/AuthConfig';
import DrawerNavigator from './app/DrawerNavigator';

function initIcons() {
  registerIconPack('ion', Ionicons);
  registerIconPack('oct', Octicons);
  registerIconPack('mci', MaterialCommunityIcons);
}

filterHandledExceptions();

export default function AppShell() {
  const APP_CONTEXT = [FIRESTORE_DATASTORE, APP_CONFIG, APP_INFO];
  initializeFirebase();
  initIcons();
  IdentityService.addProvider(googleAuthProvider());

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
