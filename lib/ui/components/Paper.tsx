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
import {Button as PaperButton} from 'react-native-paper';
import {
  ButtonApi,
  ButtonProps,
  registerComponent,
} from '@toolkit/ui/components/Components';

type ModeType = 'text' | 'outlined' | 'contained';

const TYPE_TO_MODE: Record<string, ModeType> = {
  primary: 'contained',
  secondary: 'outlined',
  tertiary: 'text',
  default: 'outlined',
};

const Button = (props: ButtonProps) => {
  const {style, labelStyle, contentStyle, type, ...rest} = props;
  const mode = TYPE_TO_MODE[type ?? 'default'];
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

export function registerPaperComponents() {
  registerComponent(ButtonApi, Button);
}
