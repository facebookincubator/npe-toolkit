/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import * as Device from 'expo-device';
import {useData} from '@toolkit/core/api/DataApi';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useNotifications} from '@toolkit/services/notifications/NotificationsClient';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {GetFaves, GetThings} from '@app/common/AppLogic';
import {Fave, Thing} from '@app/common/DataTypes';
import {registerForPushNotificationsAsync} from '../../lib/Notifications';
import CreateThingButton from '../components/CreateThingButton';
import ThingRow from '../components/ThingRow';
import CreateNewThingScreen from './CreateThingScreen';

type Props = {
  async: {
    faves: Fave[];
    allThings: Thing[];
  };
};

const AllThingsScreen: Screen<Props> = props => {
  const {navTo} = useNav();
  requireLoggedInUser();
  const {registerPushToken} = useNotifications();

  React.useEffect(() => {
    const registerForNotifs = async () => {
      const pushToken = Device.isDevice
        ? await registerForPushNotificationsAsync()
        : null;
      if (pushToken != null) {
        await registerPushToken({
          token: pushToken.data,
          type: pushToken.type,
          sandbox: __DEV__,
        });
      }
    };

    registerForNotifs();
  }, []);

  const {faves, allThings} = props.async;

  function faveFor(thing: Thing): string | undefined {
    return faves.find(fave => fave.thing.id === thing.id)?.id;
  }

  return (
    <ScrollView style={S.container}>
      <View style={S.createThingButton}>
        <CreateThingButton onPress={() => navTo(CreateNewThingScreen)} />
      </View>
      {allThings.map((thing, idx) => (
        <ThingRow
          thing={thing}
          faveId={faveFor(thing)}
          isFave={faveFor(thing) != null}
          style={{padding: 12}}
          canDelete={true}
          key={idx}
        />
      ))}
    </ScrollView>
  );
};
AllThingsScreen.title = 'All Things';
AllThingsScreen.style = {type: 'top'};

AllThingsScreen.load = async () => {
  const getAllThings = useData(GetThings);
  const getFaves = useData(GetFaves);

  const [faves, allThings] = await Promise.all([getFaves(), getAllThings()]);

  return {faves, allThings};
};

const S = StyleSheet.create({
  container: {
    flex: 1,
  },
  createThingButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});

export default AllThingsScreen;
