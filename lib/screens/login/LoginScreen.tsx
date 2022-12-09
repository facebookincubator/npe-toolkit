/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {Ionicons, MaterialIcons} from '@expo/vector-icons';
import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useState} from 'react';
import {Image, Linking, Pressable, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthType, useAuth} from '@toolkit/core/api/Auth';
import Button from '@toolkit/ui/components/legacy/Button';
import {Body, Error, Info, Link, Title} from '@toolkit/ui/components/legacy/Text';
import {useAppInfo, useTheme} from '@toolkit/core/client/Theme';
import {
  FacebookButton,
  GoogleButton,
  LoginFlowBackButton,
  LoginTermsOfService,
  PhoneButton,
} from '@toolkit/screens/login/LoginScreenParts';
import {toUserMessage} from '@toolkit/core/util/CodedError';

// Note: Separate config is only needed because SimpleLoginScreen can supports multiple apps.
// If you branch this and create your own screen, you can just edit the content inline.
export type SimpleLoginScreenConfig = {
  // Title to show on page
  title?: string;

  // Text to show below title
  subtitle?: string;

  // Auth flows to show - currently only supports `google`, `facebook` and `phone`
  authTypes: AuthType[];

  // React nav screen to go to after logging in if no "next" param is specified
  // Defaults to 'Home'
  home?: string;
};

/**
 * Basic login screen with buttons for each authType in the config.
 */
export function SimpleLoginScreen(props: {config: SimpleLoginScreenConfig}) {
  let {title, subtitle, authTypes} = props.config;
  const {appIcon, appName} = useAppInfo();
  let {backgroundColor} = useTheme();

  return (
    <SafeAreaView style={[S.root, {backgroundColor}]}>
      <LoginFlowBackButton />
      <View style={S.header}>
        <Image style={S.appLogo} source={appIcon} />
        <Title mb={8} center>
          {title}
        </Title>
        <Body center>{subtitle}</Body>
      </View>
      <AuthenticationButtons config={props.config} />
      <Info center style={S.info}>
        <LoginTermsOfService />
      </Info>
    </SafeAreaView>
  );
}

/**
 * Utility to create `<SimpleLoginScreen>` component bound to config.
 */
export function simpleLoginScreen(config: SimpleLoginScreenConfig) {
  return () => <SimpleLoginScreen config={config} />;
}

export function AuthenticationButtons(props: {
  config: SimpleLoginScreenConfig;
}) {
  const {authTypes, home} = props.config;
  const auth = useAuth();
  const {navigate} = useNavigation<any>();
  const route: any = useRoute();
  const next = route?.params?.next || home || 'Home';
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(
    null,
  );

  async function tryConnect(type: AuthType) {
    try {
      setLoginErrorMessage(null);

      const scopes =
        type === 'facebook' ? ['public_profile', 'email'] : ['email'];
      const creds = await auth.tryConnect(type, {scopes});
      await auth.login(creds);
      navigate(next);
    } catch (e) {
      console.log(e);
      setLoginErrorMessage(toUserMessage(e));
    }
  }

  // TODO: Add loading state
  const buttons = authTypes.map((type, idx) => {
    if (type === 'facebook') {
      return (
        <FacebookButton key={idx} onPress={() => tryConnect('facebook')} />
      );
    } else if (type === 'google') {
      return <GoogleButton key={idx} onPress={() => tryConnect('google')} />;
    } else if (type === 'phone') {
      return (
        <PhoneButton key={idx} onPress={() => navigate('PhoneInput', {next})} />
      );
    } else {
      return null;
    }
  });

  return (
    <>
      {loginErrorMessage && <Error center>{loginErrorMessage}</Error>}
      {buttons.map((button, index) => (
        <View key={index} style={{marginTop: 12}}>
          {authTypes.length > 1 && index === authTypes.length - 1 && (
            <Body center style={S.orText}>
              Or
            </Body>
          )}
          {button}
        </View>
      ))}
    </>
  );
}
const S = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  header: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  appLogo: {
    width: 144,
    height: 144,
    marginVertical: 16,
    borderRadius: 23,
  },
  orText: {opacity: 0.6, fontWeight: '600', marginBottom: 12},
  info: {
    marginVertical: 20,
  },
});
