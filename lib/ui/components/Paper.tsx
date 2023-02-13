/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `react-native-paper` implementations of pluggable components
 *
 * @format
 */

import React from 'react';
import {StyleProp, StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {
  Button as PaperButton,
  TextInput as PaperTextInput,
  useTheme,
} from 'react-native-paper';
import {
  ButtonApi,
  ButtonProps,
  TextInputApi,
  TextInputProps,
  registerComponent,
} from '@toolkit/ui/components/Components';

type ButtonModeType = 'text' | 'outlined' | 'contained';

const TYPE_TO_BUTTON_MODE: Record<string, ButtonModeType> = {
  primary: 'contained',
  secondary: 'outlined',
  tertiary: 'text',
  default: 'outlined',
};

const Button = (props: ButtonProps) => {
  const {style, labelStyle, contentStyle, type, ...rest} = props;
  const mode = TYPE_TO_BUTTON_MODE[type ?? 'default'] || 'outlined';
  const theRest = rest as React.ComponentProps<typeof PaperButton>;
  const viewStyleFull = StyleSheet.flatten([ButtonStyle.style, style]);
  const labelStyleFull = StyleSheet.flatten([
    ButtonStyle.labelStyle,
    labelStyle,
  ]);
  const alignForIcon =
    viewStyleFull.width != null && (props.icon != null || props.loading);
  const fontSize = labelStyleFull.fontSize ?? 16;
  const marginStyle = alignForIcon
    ? {paddingRight: fontSize + 8, backroundColor: 'red'}
    : {};

  return (
    <PaperButton
      mode={mode}
      style={viewStyleFull}
      contentStyle={[ButtonStyle.contentStyle, contentStyle, marginStyle]}
      labelStyle={labelStyleFull}
      {...theRest}
    />
  );
};

type PaperButtonStyle = {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const ButtonStyle: PaperButtonStyle = {
  labelStyle: {fontSize: 18, letterSpacing: 0, textTransform: 'none'},
};

type TextInputModeType = 'flat' | 'outlined';

const TYPE_TO_TEXT_INPUT_MODE: Record<string, TextInputModeType> = {
  primary: 'outlined',
  secondary: 'flat',
  default: 'flat',
};

const AUTOCOMPLETE_ADDITIONAL_PROPS = {
  tel: {
    keyboardType: 'phone-pad',
    textContentType: 'telephoneNumber',
  },
  name: {
    textContentType: 'name',
  },
  username: {
    textContentType: 'username',
    autoCapitalize: 'none',
  },
  email: {
    textContentType: 'emailAddress',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  url: {
    textContentType: 'URL',
    keyboardType: 'url',
    autoCapitalize: 'none',
  },
};

const TextInput = (props: TextInputProps) => {
  const {type, ...rest} = props;
  const mode = TYPE_TO_TEXT_INPUT_MODE[type ?? 'default'] || 'flat';

  // Too much roundness looks bad on flat fields
  const curTheme = useTheme();
  const maxRound = mode === 'flat' ? 4 : 100;
  const roundness = Math.min(curTheme.roundness, maxRound);
  const theme = {...curTheme, roundness};
  const ac = props.autoComplete;
  /** @ts-ignore */
  const textTypeProps = ac != null ? AUTOCOMPLETE_ADDITIONAL_PROPS[ac] : {};

  console.log(textTypeProps);
  // TODO: "type" as input type, e.g. "phone"
  const theRest = rest as React.ComponentProps<typeof PaperTextInput>;
  return (
    <PaperTextInput theme={theme} mode={mode} {...textTypeProps} {...theRest} />
  );
};

export function registerPaperComponents() {
  registerComponent(ButtonApi, Button);
  registerComponent(TextInputApi, TextInput);
}
