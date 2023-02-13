/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// TODO: moti breaks chrome debugging
// We need to disable/override this when using the debugger
import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {Keyboard, Pressable, StyleSheet} from 'react-native';
import {MotiView} from 'moti';

export function KeyboardDismissPressable() {
  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => Keyboard.dismiss()}
    />
  );
}

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
} & React.ComponentProps<typeof Pressable>;

export function PressableSpring({
  style,
  pressableStyle,
  children,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <Pressable
      style={pressableStyle}
      {...props}
      onPressIn={e => {
        setIsPressed(true);
        onPressIn && onPressIn(e);
      }}
      onPressOut={e => {
        setIsPressed(false);
        onPressOut && onPressOut(e);
      }}>
      <MotiView
        style={style}
        animate={{scale: isPressed ? 0.9 : 1}}
        transition={{type: 'spring', stiffness: 200, mass: 0.25}}>
        {children}
      </MotiView>
    </Pressable>
  );
}
