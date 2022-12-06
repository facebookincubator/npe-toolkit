/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React, {ComponentProps, ReactNode} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import PressableSpring from '@toolkit/ui/components/legacy/PressableSpring';
import {useTheme} from '@toolkit/core/client/Theme';

type Props = {
  text: string;
  onPress?: ComponentProps<typeof Pressable>['onPress'];
  disabled?: boolean;
  isLoading?: boolean;

  // Style presets
  roundness?: keyof typeof ROUNDNESS_STYLES;
  size?: keyof typeof SIZE_STYLES;

  // More customization
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftAddon?: ReactNode;

  secondary?: boolean;
};

const ROUNDNESS_STYLES = {
  none: {borderRadius: 0},
  medium: {borderRadius: 4},
  full: {borderRadius: 100},
};

const SIZE_STYLES = {
  md: {view: {height: 28}, text: {fontSize: 14}},
  lg: {view: {height: 44}, text: {fontSize: 18}},
};

export default function Button({
  text,
  onPress,
  disabled,
  isLoading,
  leftAddon,
  style,
  textStyle,
  roundness = 'full',
  size = 'md',
  secondary = false,
}: Props) {
  const roundnessStyle = ROUNDNESS_STYLES[roundness];
  const sizeStyle = SIZE_STYLES[size];
  let {
    buttonColor = 'black',
    buttonTextColor = 'white',
    textColor,
    backgroundColor,
  } = useTheme();

  let colorStyle = {backgroundColor: secondary ? undefined : buttonColor};

  if (secondary) {
    buttonTextColor = textColor;
    buttonColor = backgroundColor;
  }

  return (
    <PressableSpring
      disabled={disabled || isLoading}
      pressableStyle={styles.pressable}
      onPress={onPress}
      style={[
        styles.button,
        roundnessStyle,
        sizeStyle.view,
        colorStyle,
        style,
        (disabled || isLoading) && {opacity: 0.5},
      ]}>
      {isLoading ? (
        <ActivityIndicator style={{flex: 1}} color={buttonTextColor} />
      ) : (
        <>
          <View style={{flex: 1}}>{leftAddon}</View>
          <Text
            style={[
              styles.buttonText,
              sizeStyle.text,
              {color: buttonTextColor},
              textStyle,
            ]}>
            {text}
          </Text>
          <View style={{flex: 1}} />
        </>
      )}
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0095F6',
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  pressable: {
    alignItems: 'center',
  },
});
