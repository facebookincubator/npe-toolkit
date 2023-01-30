/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useData} from '@toolkit/core/api/DataApi';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {Screen} from '@toolkit/ui/screen/Screen';
import {GetFaves} from '@app/common/AppLogic';
import {Fave} from '@app/common/DataTypes';
import ThingRow from '../components/ThingRow';

type Props = {
  async: {
    faves: Fave[];
  };
};

const MyFavesScreen: Screen<Props> = props => {
  requireLoggedInUser();

  const {faves} = props.async;

  return (
    <View style={S.container}>
      {faves.map((fave, idx) => (
        <ThingRow
          thing={fave.thing}
          faveId={fave.id}
          isFave={true}
          style={{padding: 12}}
          key={idx}
        />
      ))}
    </View>
  );
};
MyFavesScreen.loading = () => {
  const {scaleX, scaleY} = usePulseAnimation();
  return (
    <View style={S.loading}>
      <Animated.View style={{transform: [{scaleX}, {scaleY}]}}>
        <Ionicons name="heart" size={80} color="#FF0000" />
      </Animated.View>
    </View>
  );
};
MyFavesScreen.title = 'My Faves';
MyFavesScreen.style = {type: 'top'};

MyFavesScreen.load = async () => {
  const getFaves = useData(GetFaves);
  // Give time to show the fun loading screen
  await new Promise(r => setTimeout(r, 4000));

  return {faves: await getFaves()};
};

function usePulseAnimation() {
  const scale = new Animated.Value(1);
  const anim = {useNativeDriver: true, duration: 800};

  function startAnimation() {
    Animated.timing(scale, {toValue: 0.5, ...anim}).start(() =>
      Animated.timing(scale, {toValue: 1, ...anim}).start(startAnimation),
    );
  }

  React.useEffect(startAnimation, []);
  return {scaleX: scale, scaleY: scale};
}

const S = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MyFavesScreen;
