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
import {StyleProp, TextStyle, TouchableOpacity, ViewStyle} from 'react-native';

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
 * TODO: `useComponents()`
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
