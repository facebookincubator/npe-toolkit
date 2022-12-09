/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {Ionicons, MaterialIcons} from '@expo/vector-icons';
import {useNavigation, useRoute} from '@react-navigation/native';
import React, {ReactDOM} from 'react';
import {Image, Linking, Pressable, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthType, useAuth} from '@toolkit/core/api/Auth';
import Button from '@toolkit/ui/components/legacy/Button';
import {Body, Info, Link, Title} from '@toolkit/ui/components/legacy/Text';
import {useAppInfo, useTheme} from '@toolkit/core/client/Theme';

export function FacebookButton(props: {onPress: () => Promise<void> | void}) {
  const {onPress} = props;
  const theme = useTheme();
  return (
    <Button
      text="Sign in with Facebook"
      size="lg"
      style={[S.button, {backgroundColor: '#1877F2'}]}
      textStyle={{color: theme?.backgroundColor}}
      leftAddon={
        <MaterialIcons
          name="facebook"
          size={32}
          color={theme?.buttonTextColor ?? 'white'}
        />
      }
      onPress={onPress}
    />
  );
}

export function GoogleButton(props: {onPress: () => Promise<void> | void}) {
  // TODO Use real branding
  const {onPress} = props;
  return (
    <Button
      style={S.button}
      text="Sign in with Google"
      size="lg"
      onPress={onPress}
    />
  );
}

export function PhoneButton(props: {onPress: () => Promise<void> | void}) {
  const {onPress} = props;

  return (
    <Button
      style={S.button}
      text="Sign in with Phone Number"
      size="lg"
      onPress={onPress}
    />
  );
}

type AProps = {
  href: string;
  children?: React.ReactNode;
};

const A = (props: AProps) => {
  const {href, children} = props;
  return <Link onPress={() => Linking.openURL(href)}>{children}</Link>;
};

type TOSProps = {
  availableInEu?: boolean;
};

export function LoginTermsOfService(props: TOSProps) {
  const {availableInEu = false} = props;
  // TODO: Consider simple markdown formatting for this type of block
  return (
    <>
      By continuing, you accept{' '}
      <A href="https://www.facebook.com/legal/terms">Meta's Terms of Service</A>
      {', '}
      <A href="https://www.facebook.com/about/privacy">Data Policy</A>
      {' and the '}
      <A href="https://npe.facebook.com/supplement">Supplemental NPE Terms.</A>
      {availableInEu && (
        <>
          {'\n\n'}For EU Users, see the{' '}
          <A href="https://npe.facebook.com/about/eu_data_policy">
            EU Data Policy for NPE
          </A>{' '}
          instead.
        </>
      )}
    </>
  );
}

export function LoginFlowBackButton(props: {back?: () => void}) {
  const {back} = props;
  const nav = useNavigation<any>();
  const {textColor} = useTheme();

  return (
    <>
      {nav.canGoBack() && (
        <>
          <Ionicons
            suppressHighlighting={true}
            name="chevron-back"
            size={36}
            onPress={() => (back ? back() : nav.goBack())}
            style={S.backButton}
            color={textColor}
          />
        </>
      )}
    </>
  );
}

const S = StyleSheet.create({
  backButton: {
    zIndex: 5,
    marginLeft: -10,
    width: 36,
    height: 36,
  },
  button: {
    maxWidth: 350,
  },
});
