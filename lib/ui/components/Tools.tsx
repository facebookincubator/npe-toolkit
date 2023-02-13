/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {Keyboard, Pressable, StyleSheet} from 'react-native';

export function KeyboardDismissPressable() {
  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => Keyboard.dismiss()}
    />
  );
}
