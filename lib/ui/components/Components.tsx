/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Pluggable components used to display common screens, along with
 * default implementations.
 *
 * Not required to use these - limitation is that if you want to make
 * the common screens consistent with the rest of your app, you'll need to make
 * and modify a local copy of them
 *
 * Starting with style, `<Button>`, `<TextInput>`, and a few common text styles,
 * but will be adding most common controls over time.
 *
 * @format
 */

import React from 'react';
import {
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

const componentRegistry: Record<string, React.ComponentType<any>> = {};
type ComponentApi<Props> = {key: string; props?: Props};

function makeComponentApi<Props>(key: string): ComponentApi<Props> {
  return {key};
}

export function registerComponent<Props>(
  api: ComponentApi<Props>,
  impl: React.ComponentType<Props>,
) {
  componentRegistry[api.key] = impl;
}

/**
 * TODO: `useComponents()` with type safety
 */
export function useComponent<Props>(
  api: ComponentApi<Props>,
): React.ComponentType<Props> {
  const component = componentRegistry[api.key];
  if (!component) {
    throw Error(`Component not registered for type "${api.key}"`);
  }

  return component;
}

/**
 * TODO: Document
 */
export type ButtonProps = Partial<
  React.ComponentProps<typeof TouchableOpacity>
> & {
  labelStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  icon?: string;
  // primary, seconary, tertiary, app-specific
  // "primary" is long, maybe want other
  type?: string;
};

export const ButtonApi: ComponentApi<ButtonProps> =
  makeComponentApi<ButtonProps>('Button');

export type TextInputProps = Partial<React.ComponentProps<typeof TextInput>> & {
  // TO TEST: error, left/right
  label?: string;
  render?: (
    props: Partial<React.ComponentProps<typeof TextInput>>,
  ) => React.ReactNode;
  type?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  extraStyle?: StyleProp<ViewStyle>; // maybe
};

export const TextInputApi: ComponentApi<TextInputProps> =
  makeComponentApi<TextInputProps>('TextInput');

export type TextProps = React.ComponentProps<typeof Text> & {
  /** Whether to center the text **/
  center?: boolean;
  /** Shorthand for margin botton style */
  mb?: number;
};

export const TextComponentApis: Record<string, ComponentApi<TextProps>> = {
  H1: makeComponentApi<TextProps>('H1'),
  H2: makeComponentApi<TextProps>('H2'),
  H3: makeComponentApi<TextProps>('H3'),
  H4: makeComponentApi<TextProps>('H4'),
  Body: makeComponentApi<TextProps>('Body'),
  Info: makeComponentApi<TextProps>('Info'),
  Error: makeComponentApi<TextProps>('Error'),
  Link: makeComponentApi<TextProps>('Link'),
};

/**
 * Utility to register styles for a set of text components.
 *
 * This is a convenience, and you can use abitrary components for your text components.
 */
export function registerTextStyles(
  styles: Record<string, StyleProp<TextStyle>>,
) {
  const defaultStyle = styles['default'] ?? {};

  for (const key in styles) {
    if (key !== 'default') {
      const style = [defaultStyle, styles[key]];
      registerComponent(TextComponentApis[key], textComponent(style));
    }
  }
}

/**
 * Create a styled text component based on react-native `<Text>` and a set of props.
 * This is a convenience, and you can use abitrary components for your text components.
 */
export function textComponent(
  defaultStyle: StyleProp<TextStyle>,
  defaults?: TextProps,
): React.ComponentType<TextProps> {
  return ({center, mb, style, ...props}) => {
    return (
      <Text
        {...defaults}
        style={[
          defaultStyle,
          center && {textAlign: 'center'},
          mb != null && {marginBottom: mb},
          style,
        ]}
        {...props}
      />
    );
  };
}
