/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import * as React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNav} from '@toolkit/ui/screen/Nav';

const Modal = ({children}: {children?: React.ReactNode}) => {
  const nav = useNav();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {zIndex: 5, backgroundColor: 'rgba(0, 0, 0, 0.3)'},
        ]}
        onPress={nav.back}
      />
      <View style={{zIndex: 10}}>{children}</View>
    </View>
  );
};

export default Modal;
