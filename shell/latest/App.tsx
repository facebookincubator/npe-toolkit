/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Trigger retest
import 'expo-dev-client';
import * as foo from 'expo-dev-client';
import {DevMenu, isDevelopmentBuild} from 'expo-dev-client';
import {Button, StyleSheet, Text, View} from 'react-native';
import * as WebViewShared from 'react-native-webview/lib/WebViewShared';

let reactNativeWebViewCrashPatched = false;

// TODO: Add this to FirebasePhoneUtils, as that is the proximate use case that is most important
function patchReactNativeWebViewCrash() {
  if (!reactNativeWebViewCrashPatched) {
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
}
patchReactNativeWebViewCrash();
const foo: string = 5;
export default function App() {

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text style={{textAlign:'center'}}>{devInfo()}</Text>
      <Button onPress={() => DevMenu.openMenu()} title="Open dev menu"/>
    </View>
  );
}

function devInfo() {
  return `Dev build: ${String(isDevelopmentBuild())}
  __DEV__: ${String(__DEV__)}
  env: ${JSON.stringify(process.env)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
});
