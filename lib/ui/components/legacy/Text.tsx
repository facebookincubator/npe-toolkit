/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React from 'react';
import {Text, TextProps, TextStyle} from 'react-native';
import {useTheme} from '@toolkit/core/client/Theme';

type CustomProps = {center?: boolean; mb?: number};

export type TextComponent = React.FunctionComponent<TextProps & CustomProps>;

function styledText(presetStyle: TextStyle): TextComponent {
  return ({center, mb, style, ...props}) => {
    const {textColor = 'black'} = useTheme();
    return (
      <Text
        style={[
          {color: textColor},
          presetStyle,
          style,
          center && {textAlign: 'center'},
          mb != null && {marginBottom: mb},
        ]}
        {...props}
      />
    );
  };
}

export const Title = styledText({fontSize: 24, fontWeight: '600'});
export const Subtitle = styledText({fontSize: 17, fontWeight: '600'});
export const Body = styledText({fontSize: 16});
export const Info = styledText({fontSize: 14, opacity: 0.9});
export const Error = styledText({fontSize: 14, color: '#DE2B2B'});
export const Link = styledText({
  fontSize: 14,
  opacity: 0.9,
  fontWeight: '600',
});
