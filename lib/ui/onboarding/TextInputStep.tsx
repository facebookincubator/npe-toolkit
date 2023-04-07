/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, StyleSheet, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@toolkit/core/client/Theme';
import {toUserMessage} from '@toolkit/core/util/CodedError';
import {Opt} from '@toolkit/core/util/Types';
import {LoginFlowBackButton} from '@toolkit/screens/login/LoginScreenParts';
import {useFlow} from '@toolkit/ui/Components/MultistepFlow';
import {useComponents} from '@toolkit/ui/components/Components';
import {KeyboardDismissPressable, alert} from '@toolkit/ui/components/Tools';

/**
 * Information about the field being edited that is usable across multiple surfaces.
 * (e.g. if you have a page with multiple fields, these would apply)
 */
export type FieldInfo = {
  label: string;
  required?: boolean;
  verify?: (answer: string) => {isValid: boolean; errorMessage?: string};
};

/**
 * Configuration for a `<TextInputStep>` page
 */
export type TextInputStepConfig = {
  title?: string;
  prompt?: string;
  submitText?: string;
  field: FieldInfo;
};

type Props = {
  // Initial value
  value?: Opt<string>;

  // Configuration used to render the field
  config: TextInputStepConfig;

  // Callback when user clicks "next" on the page
  // Should throw an error the values are invalid or flow can't move forward
  onNext: (value: string) => void | Promise<void>;
};

/**
 * A step in a `<MultistepFlow>` that edits a single text field.
 *
 * Text field is configured using `<FieldInfo>` type, however state management
 * is deferred to the parent component using `onNext()` callback, which can
 * record changes to state and perform any additional validation.
 */
export default function TextInputStep({config, onNext, value: val}: Props) {
  const flow = useFlow();
  const {title, prompt, field, submitText} = config;
  const {label, required, verify} = field;
  const {top} = useSafeAreaInsets();
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(val ?? '');
  const {textColor, backgroundColor} = useTheme();
  const {Button, TextInput, Body, Title} = useComponents();

  useEffect(() => {
    if (field.required) {
      setIsValid(value.length > 0);
    }
    if (verify != null) {
      const {isValid, errorMessage} = verify(value);
      setError(errorMessage ?? null);
      setIsValid(isValid);
    }
  }, [value]);

  async function nextStep() {
    try {
      await onNext(value);
      await flow.next();
    } catch (e) {
      console.log(e);
      alert(toUserMessage(e));
    }
  }

  const nextText = flow.isLast() ? submitText ?? 'Finish' : 'Continue';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={'padding'}
      keyboardVerticalOffset={top}>
      <SafeAreaView style={[styles.container, {backgroundColor}]}>
        <LoginFlowBackButton back={flow.back} />
        <KeyboardDismissPressable />

        <View style={styles.spaced}>
          <View>
            {title && <Title mb={16}>{title}</Title>}
            {prompt && <Body>{prompt}</Body>}
          </View>

          <TextInput
            label={label}
            type="primary"
            value={value}
            onChangeText={setValue}
          />

          <View>
            {/** Need back button? */}
            <Button type="primary" onPress={nextStep} disabled={!isValid}>
              {nextText}
            </Button>
            {!required && (
              <Button
                type="primary"
                style={{backgroundColor: '#00000000', marginTop: 8}}
                labelStyle={{color: textColor}}
                onPress={flow.next}>
                Skip
              </Button>
            )}
          </View>
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
  container: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  spaced: {marginTop: 18, flex: 1, justifyContent: 'space-between'},
});
