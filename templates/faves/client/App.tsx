/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {NavItem, tabLayout} from '@toolkit/ui/layout/TabLayout';
import {fbAuthProvider} from '@toolkit/providers/login/FacebookLogin';
import {googleAuthProvider} from '@toolkit/providers/login/GoogleLogin';
import IdentityService from '@toolkit/core/api/Login';
import {CONSOLE_LOGGER} from '@toolkit/core/api/Log';
import {FIREBASE_LOGGER} from '@toolkit/providers/firebase/client/Logger';
import {FIRESTORE_DATASTORE} from '@toolkit/providers/firebase/DataStore';
import PhoneInput from '@toolkit/screens/login/PhoneInput';
import PhoneVerification from '@toolkit/screens/login/PhoneVerification';
import {NotificationSettingsScreen} from '@toolkit/screens/settings/NotificationSettings';
import {BLACK_AND_WHITE} from '@toolkit/ui/QuickThemes';
import {Routes} from '@toolkit/ui/screen/Nav';
import {NavContext, useReactNavScreens} from '@toolkit/providers/navigation/ReactNavigation';
import {Icon, registerIconPack} from '@toolkit/ui/components/Icon';
import {SimpleUserMessaging} from '@toolkit/core/client/UserMessaging';
import WebViewScreen from '@toolkit/ui/screen/WebScreen';
import {filterHandledExceptions} from '@toolkit/core/util/Environment';
import {registerAppConfig} from '@toolkit/core/util/AppConfig';
import {AppContextProvider} from '@toolkit/core/util/AppContext';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import 'expo-dev-client';
import {StatusBar} from 'expo-status-bar';
import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import 'react-native-gesture-handler';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AuthConfig from './app/AuthConfig';
import AboutScreen from './app/screens/AboutScreen';
import AllThingsScreen from './app/screens/AllThingsScreen';
import CreateNewThingScreen from './app/screens/CreateThingScreen';
import LoginScreen from './app/screens/LoginScreen';
import MyFavesScreen from './app/screens/MyFavesScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import StartupScreen from './app/screens/StartupScreen';
import {APP_CONFIG, APP_INFO, NOTIF_CHANNELS_CONTEXT} from './lib/Config';
import {initializeFirebase} from './lib/Firebase';

//
/**
 * Hacky workaround for 'react-native-webview' crashing app when JS is unloaded.
 *
 * `onContentProcessDidTerminate` bridge is always called when view is unloaded and
 * if JS engine is already stopped this will terminate the app, as the event callback
 * fires and React force quits.
 *
 * This happens in Expo Go but could also see it occuring during hot reloading.
 *
 * Temporary fix is to patch to set onContentProcessDidTerminate in bridge when the prop is
 * passed into the React Component.
 *
 */

let reactNativeWebViewCrashPatched = false;

// TODO: Move this to FirebasePhoneUtils, as that is the proximate use case that is most important
function patchReactNativeWebViewCrash() {
  if (Platform.OS !== 'web') {
    try {
      if (!reactNativeWebViewCrashPatched) {
        const WebViewShared = require('react-native-webview/lib/WebViewShared');
        const useWebWiewLogic = WebViewShared.useWebWiewLogic;
        /** @ts-ignore */
        WebViewShared.useWebWiewLogic = props => {
          const result = useWebWiewLogic(props);
          if (!props.onContentProcessDidTerminateProp && result) {
            /** @ts-ignore */
            delete result['onContentProcessDidTerminate'];
          }
          return result;
        };
        reactNativeWebViewCrashPatched = true;
      }
    } catch (ignored) {}
  }
}
patchReactNativeWebViewCrash();

filterHandledExceptions();

// TODO: Hack to hide header to avoid double back buttons.
// Fix this by converting these to Screens
// @ts-ignore
PhoneInput.style = {nav: 'none'};
// @ts-ignore
PhoneVerification.style = {nav: 'none'};
const ROUTES: Routes = {
  StartupScreen,
  LoginScreen,
  MyFavesScreen,
  AllThingsScreen,
  SettingsScreen,
  CreateNewThingScreen,
  PhoneInput,
  PhoneVerification,
  WebViewScreen,
  AboutScreen,
  NotificationSettingsScreen,
};
const Stack = createStackNavigator();

const TABS: NavItem[] = [
  {
    icon: 'ion:images-outline',
    title: 'All Things',
    screen: AllThingsScreen,
    route: 'AllThingsScreen',
  },
  {
    icon: 'ion:heart-outline',
    title: 'Faves',
    screen: MyFavesScreen,
    route: 'MyFavesScreen',
  },
];

const HEADER_RIGHT: NavItem[] = [
  {
    icon: 'ion:settings-outline',
    title: 'Settings',
    screen: SettingsScreen,
    route: 'SettingsScreen',
  },
];

// Set this to true to enable logging to Firebase Analytics
const USE_FIREBASE_ANALYTICS = false;

const LOGGER = USE_FIREBASE_ANALYTICS ? FIREBASE_LOGGER : CONSOLE_LOGGER;
const APP_CONTEXT = [
  APP_CONFIG,
  APP_INFO,
  FIRESTORE_DATASTORE,
  LOGGER,
  NOTIF_CHANNELS_CONTEXT,
];

export default function App() {
  registerAppConfig(APP_CONFIG);
  initializeFirebase();
  IdentityService.addProvider(fbAuthProvider());
  IdentityService.addProvider(googleAuthProvider());
  registerIconPack('ion', Ionicons);
  registerIconPack('mci', MaterialCommunityIcons);

  const {navScreens, linkingScreens} = useReactNavScreens(
    ROUTES,
    tabLayout({
      tabs: TABS,
      headerRight: HEADER_RIGHT,
      loginScreen: LoginScreen,
    }),
    Stack.Screen,
  );

  // For deep links
  const linking = {
    prefixes: ['hax-app.npe.app'],
    config: linkingScreens,
  };

  return (
    <AppContextProvider ctx={APP_CONTEXT}>
      <PaperProvider theme={BLACK_AND_WHITE} settings={{icon: Icon}}>
        <AuthConfig>
          <View style={S.background}>
            <SafeAreaProvider style={S.container}>
              <SimpleUserMessaging style={S.messaging} />
              <NavigationContainer linking={linking}>
                <StatusBar style="auto" />
                <NavContext routes={ROUTES} />
                <Stack.Navigator
                  screenOptions={{headerShown: false}}
                  initialRouteName="StartupScreen">
                  {navScreens}
                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaProvider>
          </View>
        </AuthConfig>
      </PaperProvider>
    </AppContextProvider>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  messaging: {
    bottom: 100,
  },
  background: {flex: 1, backgroundColor: '#202020'},
});