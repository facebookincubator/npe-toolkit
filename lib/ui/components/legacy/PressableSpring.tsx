/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

// TODO: moti breaks chrome debugging
// We need to disable/override this when using the debugger
import {MotiView} from 'moti';
import React, {ComponentProps, ReactNode, useState} from 'react';
import {Pressable, StyleProp, ViewStyle} from 'react-native';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
} & ComponentProps<typeof Pressable>;

export default function PressableSpring({
  style,
  pressableStyle,
  children,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const [isPressed, setIsPressed] = useState(false);

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
