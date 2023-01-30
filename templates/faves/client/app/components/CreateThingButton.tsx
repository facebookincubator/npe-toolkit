/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

type Props = {
  onPress: () => void;
};
export default function CreateThingButton({onPress}: Props) {
  return (
    <Pressable onPress={onPress}>
      <View style={{flexDirection: 'row'}}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 7,
            backgroundColor: 'lightgray',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
          }}>
          <Ionicons
            name="add-outline"
            color="gray"
            size={60}
            style={{
              alignSelf: 'center',
              alignContent: 'center',
              justifyContent: 'center',
              marginLeft: 2,
            }}
          />
        </View>
        <View style={{alignSelf: 'center', marginLeft: 10, flex: 1}}>
          <Text style={{fontSize: 18}}>Add new thing</Text>
          <Text style={{color: 'gray', fontStyle: 'italic'}}>
            Click here to add a new thing
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
