/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState} from 'react';
import {KeyboardAvoidingView, StyleSheet, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '@toolkit/core/api/Auth';
import {useTheme} from '@toolkit/core/client/Theme';
import {toError} from '@toolkit/core/util/Types';
import {LoginFlowBackButton} from '@toolkit/screens/login/LoginScreenParts';
import {useComponents} from '@toolkit/ui/components/Components';
import {KeyboardDismissPressable} from '@toolkit/ui/components/Tools';

type Params = {
  phone: string;
  next?: string;
};

export default function PhoneVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const {navigate} = useNavigation<any>();
  const {top} = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const params = useRoute().params as Params;
  const auth = useAuth();
  const {backgroundColor} = useTheme();
  const next = params?.next || 'Home';
  const {Button, TextInput, Title, Body, Error} = useComponents();

  const onSubmit = async () => {
    setIsLoading(true);

    try {
      const phone = params.phone;
      const user = await auth.login({type: 'phone', id: phone, token: code});
      navigate(next);
    } catch (e) {
      setCode('');
      setError(toError(e).message);
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor}]}
      behavior={'padding'}
      keyboardVerticalOffset={top}>
      <SafeAreaView style={styles.container}>
        <LoginFlowBackButton />
        <KeyboardDismissPressable />

        <View style={styles.spaced}>
          <View>
            <Title mb={16}>Verification</Title>
            <Body>
              Verify your number with the six-digit code we just sent you.
            </Body>
          </View>

          <View>
            <TextInput
              label="Code"
              type="primary"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
            <View style={styles.row}>
              {error != null && (
                <View style={{paddingLeft: 10}}>
                  <Error>Error - {error}</Error>
                </View>
              )}
              <View style={{width: 1}} />
              <Button
                type="secondary"
                labelStyle={{fontSize: 14}}
                onPress={() => navigate('PhoneInput')}>
                Resend Code
              </Button>
            </View>
          </View>

          <Button
            type="primary"
            style={{width: '100%', alignSelf: 'center'}}
            loading={isLoading}
            onPress={onSubmit}>
            Verify
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  row: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  container: {padding: 16, flex: 1},
  spaced: {marginTop: 18, flex: 1, justifyContent: 'space-between'},
});
