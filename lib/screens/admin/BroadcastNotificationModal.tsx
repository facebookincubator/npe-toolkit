/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  TextStyle,
  ColorValue,
} from 'react-native';
import {Icon} from '@toolkit/ui/components/Icon';
import {IconProps} from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';

type Props = {
  color: ColorValue;
  text: string;
  iconProps: Pick<IconProps, 'name' | 'color'>;
  textStyle?: StyleProp<TextStyle>;
  height?: number;
};

export default function Banner(props: Props) {
  const {color, iconProps, height = 40, text, textStyle} = props;
  return (
    <View style={[S.container, {borderColor: color}]}>
      <View
        style={[
          S.iconContainer,
          {backgroundColor: color, width: height, height},
        ]}>
        <Icon {...iconProps} size={height * 0.75} />
      </View>
      <View
        style={[S.textBackground, {backgroundColor: color, left: height}]}
      />
      <Text style={[{paddingVertical: 5, paddingHorizontal: 15}, textStyle]}>
        {text}
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBackground: {
    opacity: 0.2,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
  },
});
