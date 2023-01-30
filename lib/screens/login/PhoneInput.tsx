/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {useNavigation, useRoute} from '@react-navigation/native';
import {FirebaseRecaptchaBanner} from 'expo-firebase-recaptcha';
import {format, isValidPhoneNumber, parse} from 'libphonenumber-js';
import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, StyleSheet, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '@toolkit/core/api/Auth';
import Button from '@toolkit/ui/components/legacy/Button';
import {Body, Title} from '@toolkit/ui/components/legacy/Text';
import TextField, {
  KeyboardDismissPressable,
} from '@toolkit/ui/components/legacy/TextField';
import {useTheme} from '@toolkit/core/client/Theme';
import {LoginFlowBackButton} from '@toolkit/screens/login/LoginScreenParts';

type Params = {
  next?: string;
};

export default function PhoneInput() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const {top} = useSafeAreaInsets();
  const auth = useAuth();
  const {textColor} = useTheme();
  const params = useRoute().params as Params;
  const {navigate} = useNavigation<any>();
  const {backgroundColor} = useTheme();

  useEffect(() => {
    setIsValid(isValidPhoneNumber(phoneNumber, 'US'));
  }, [phoneNumber]);

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const normalizedPhoneNumber = format(
        parse(phoneNumber, 'US'),
        'INTERNATIONAL',
      );
      await auth.sendCode('phone', normalizedPhoneNumber);
      navigate('PhoneVerification', {
        phone: normalizedPhoneNumber,
        next: params?.next,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[S.root, {backgroundColor}]}
      behavior={'padding'}
      keyboardVerticalOffset={top}>
      <SafeAreaView style={S.container}>
        <LoginFlowBackButton />
        <KeyboardDismissPressable />
        <View style={S.spaced}>
          <View>
            <Title mb={16}>Sign up or sign in</Title>
            <Body>
              We’ll text you to verify your number. Standard message and data
              rates apply.
            </Body>
          </View>

          <TextField
            label="Phone Number"
            type="phone"
            onChangeText={setPhoneNumber}
          />

          <Button
            disabled={!isValid}
            text="Continue"
            size="lg"
            isLoading={isLoading}
            onPress={onSubmit}
          />
        </View>
        <FirebaseRecaptchaBanner
          textStyle={{
            opacity: 0.9,
            color: textColor,
            fontSize: 14,
            textAlign: 'center',
          }}
          linkStyle={{
            opacity: 0.9,
            color: textColor,
            fontSize: 14,
            fontWeight: '600',
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: {flex: 1},
  container: {padding: 16, flex: 1},
  spaced: {
    marginTop: 18,
    marginBottom: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
});
