/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {Linking, StyleSheet} from 'react-native';
import {View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@toolkit/core/client/Theme';
import {ButtonApi, useComponent} from '@toolkit/ui/components/Components';
import {TextComponentApis} from '@toolkit/ui/components/Components';

export function FacebookButton(props: {onPress: () => Promise<void> | void}) {
  const {onPress} = props;
  const Button = useComponent(ButtonApi);
  return (
    <Button
      type="primary"
      style={[S.button, {backgroundColor: '#1877F2'}]}
      icon="mci:facebook"
      onPress={onPress}>
      Sign in with Facebook
    </Button>
  );
}

export function GoogleButton(props: {onPress: () => Promise<void> | void}) {
  // TODO Use real branding
  const {onPress} = props;
  const Button = useComponent(ButtonApi);
  return (
    <View>
      <Button type="primary" style={S.button} onPress={onPress}>
        Sign in with Google
      </Button>
    </View>
  );
}

export function PhoneButton(props: {onPress: () => Promise<void> | void}) {
  const {onPress} = props;
  const Button = useComponent(ButtonApi);

  return (
    <Button type="primary" style={S.button} onPress={onPress}>
      Sign in with Phone Number
    </Button>
  );
}

type AProps = {
  href: string;
  children?: React.ReactNode;
};

const A = (props: AProps) => {
  const {href, children} = props;
  const Link = useComponent(TextComponentApis.Link);

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
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
});
