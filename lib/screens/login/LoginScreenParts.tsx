/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@toolkit/core/client/Theme';
import {useComponents} from '@toolkit/ui/components/Components';
import {Icon} from '@toolkit/ui/components/Icon';

type LoginButtonProps = {
  onPress: () => Promise<void> | void;
  loading?: boolean;
};

export function FacebookButton(props: LoginButtonProps) {
  const {onPress, loading = false} = props;
  const {Button} = useComponents();

  return (
    <Button
      type="primary"
      style={[S.button, {backgroundColor: '#1877F2'}]}
      icon="mci:facebook"
      loading={loading}
      onPress={onPress}>
      Sign in with Facebook
    </Button>
  );
}

export function GoogleButton(props: LoginButtonProps) {
  const {onPress, loading = false} = props;
  const {Button} = useComponents();

  return (
    <View>
      <Button
        type="primary"
        style={S.button}
        onPress={onPress}
        loading={loading}>
        Sign in with Google
      </Button>
    </View>
  );
}

export function PhoneButton(props: LoginButtonProps) {
  const {onPress, loading = false} = props;
  const {Button} = useComponents();

  return (
    <Button type="primary" style={S.button} onPress={onPress} loading={loading}>
      Sign in with Phone Number
    </Button>
  );
}

export function LoginFlowBackButton(props: {back?: () => void}) {
  const {back} = props;
  const nav = useNavigation<any>();
  const {textColor} = useTheme();
  const show = back || nav.canGoBack();

  function onBack() {
    if (back) {
      back();
    } else {
      nav.goBack();
    }
  }

  return (
    <>
      {show && (
        <Pressable onPress={onBack}>
          <Icon
            name="ion:chevron-back"
            size={36}
            style={S.backButton}
            color={textColor}
          />
        </Pressable>
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
