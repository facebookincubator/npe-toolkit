/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {AsYouType} from 'libphonenumber-js';
// TODO: moti and react-native-reanimated break chrome debugging
// We need to disable/override these when using the debugger
import {Text} from 'moti';
import React, {ComponentProps, useState} from 'react';
import {
  Keyboard,
  PixelRatio,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {Easing} from 'react-native-reanimated';
import {useTheme} from '@toolkit/core/client/Theme';

export type TextFieldType =
  | 'phone'
  | 'number'
  | 'name'
  | 'username'
  | 'email'
  | 'text'
  | 'multiline'
  | 'url';

type Props = {
  label: string;
  type: TextFieldType;
  error?: boolean;
  textInputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
} & Omit<ComponentProps<TextInput>, 'style'>;

export default function TextField({
  label,
  type,
  error,
  onChangeText,
  value,
  textInputStyle,
  style,
  ...textInputProps
}: Props) {
  const [textWidth, setTextWidth] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [_value, setValue] = useState(value);
  const shrinkLabel = isFocused || (_value && _value.length > 0);
  const theme = useTheme();
  const textInputRef = React.useRef<any>();

  const inputTypeProps = getInputTypeProps(type);

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  const animate = {
    scale: shrinkLabel ? 0.5 : 1,
    translateX: shrinkLabel ? -(textWidth * 0.25) : 0,
    translateY: shrinkLabel ? -(PixelRatio.getFontScale() * 25) : 0,
  };

  return (
    <View style={style}>
      <Pressable onPress={() => textInputRef.current?.focus()}>
        <Text
          onLayout={e => setTextWidth(e.nativeEvent.layout.width)}
          style={[
            styles.label,
            {color: theme?.textColor ?? 'black', opacity: 0.6},
          ]}
          animate={animate}
          transition={{
            type: 'timing',
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }}>
          {label}
        </Text>
      </Pressable>
      <TextInput
        {...inputTypeProps}
        ref={textInputRef}
        style={[
          styles.input,
          type === 'multiline' && {fontSize: 16},
          theme?.textColor != null && {color: theme.textColor},
          textInputStyle,
        ]}
        value={_value}
        onChangeText={newValue => {
          if (type === 'phone') {
            if (
              _value &&
              _value.endsWith(')') &&
              _value.length - newValue.length === 1
            ) {
              newValue = newValue.slice(0, -1);
            }
            newValue = new AsYouType('US').input(newValue);
          }

          setValue(newValue);
          onChangeText && onChangeText(newValue);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...textInputProps}
      />
      <View
        style={[
          styles.border,
          theme?.textColor != null && {borderColor: theme.textColor},
          error && {borderColor: '#EB5757'},
        ]}
      />
    </View>
  );
}

export function KeyboardDismissPressable() {
  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => Keyboard.dismiss()}
    />
  );
}

function getInputTypeProps(
  type: Props['type'],
): Partial<ComponentProps<TextInput>> {
  let props;
  switch (type) {
    case 'phone':
      props = {
        autoCompleteType: 'tel',
        keyboardType: 'phone-pad',
        textContentType: 'telephoneNumber',
      };
    case 'number':
      props = {
        keyboardType: 'number-pad',
      };
    case 'name':
      props = {
        autoCompleteType: 'name',
        textContentType: 'name',
      };
    case 'username':
      props = {
        autoCompleteType: 'username',
        textContentType: 'username',
        autoCapitalize: 'none',
      };
    case 'email':
      props = {
        autoCompleteType: 'email',
        textContentType: 'emailAddress',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      };
    case 'url':
      props = {
        autoCompleteType: 'off',
        textContentType: 'URL',
        keyboardType: 'url',
        autoCapitalize: 'none',
      };
    case 'text':
      props = {};
    case 'multiline':
      props = {multiline: true};
    default:
      props = {};
  }
  // @ts-ignore Compatibility for param name change in RN 66
  if (props.autoCompleteType != null) {
    // @ts-ignore
    props.autoComplete = props.autoCompleteType;
  }
  return props;
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    fontSize: 24,
    top: 0,
  },
  border: {
    borderColor: 'black',
    borderWidth: 1,
  },
  input: {
    fontSize: 24,
    marginBottom: 8,
  },
});
