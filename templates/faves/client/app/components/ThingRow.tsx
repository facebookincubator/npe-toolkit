/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {ViewStyle} from 'react-native';
import {Image, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useData} from '@toolkit/core/api/DataApi';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useReload} from '@toolkit/core/client/Reload';
import {useMessageOnFail} from '@toolkit/core/client/UserMessaging';
import {useDataStore} from '@toolkit/data/DataStore';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';
import {PressableSpring} from '@toolkit/ui/components/Tools';
import {SEND_FAVE_NOTIF, SEND_THING_DELETE_NOTIF} from '@app/common/Api';
import {AddFave, RemoveThing} from '@app/common/AppLogic';
import {Fave, Thing} from '@app/common/DataTypes';

type Props = {
  thing: Thing;
  isFave: boolean;
  faveId?: string;
  style?: ViewStyle;
  canDelete?: boolean;
};

export default function ThingRow(props: Props) {
  const {thing, isFave, faveId, style, canDelete = false} = props;
  const {imageUrl} = thing;
  requireLoggedInUser();
  const addFave = useData(AddFave);
  const faveStore = useDataStore(Fave);
  const removeThing = useData(RemoveThing);
  const reload = useReload();
  const messageOnFail = useMessageOnFail();

  const sendFaveNotif = useApi(SEND_FAVE_NOTIF);
  const sendDeleteNotif = useApi(SEND_THING_DELETE_NOTIF);

  async function makeFave() {
    const fave = await addFave(thing.id);
    sendFaveNotif(fave).catch((e: Error) =>
      console.error("Couldn't send notification", e),
    );
    reload();
  }

  async function unFave() {
    // TODO: Look up based on thing ID instead
    if (faveId) {
      await faveStore.remove(faveId);
      reload();
    }
  }

  async function onRemove() {
    await removeThing(thing.id);
    sendDeleteNotif(thing.name).catch((e: Error) =>
      console.error("Couldn't send notification", e),
    );
    reload();
  }

  return (
    <View style={[{flexDirection: 'row'}, style]}>
      {imageUrl != null && imageUrl !== '' ? (
        <Image
          style={{width: 60, height: 60, borderRadius: 7}}
          source={{uri: imageUrl}}
        />
      ) : (
        <DefaultThumbnail />
      )}
      <View style={{alignSelf: 'center', marginLeft: 10, flex: 1}}>
        <Text style={{fontSize: 18}}>{props.thing.name}</Text>
        <Text style={{color: 'gray'}}>{props.thing.description}</Text>
      </View>

      {canDelete && (
        <PressableSpring
          onPress={messageOnFail(onRemove)}
          style={{alignSelf: 'center', marginRight: 6}}>
          <Ionicons name="close-circle-outline" color="gray" size={30} />
        </PressableSpring>
      )}
      {isFave ? (
        <PressableSpring onPress={unFave} style={{alignSelf: 'center'}}>
          <Ionicons name="heart" color="red" size={30} />
        </PressableSpring>
      ) : (
        <PressableSpring
          onPress={messageOnFail(makeFave)}
          style={{alignSelf: 'center'}}>
          <Ionicons name="heart-outline" color="gray" size={30} />
        </PressableSpring>
      )}
    </View>
  );
}

const DefaultThumbnail = () => {
  return (
    <View
      style={{
        alignSelf: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 7,
        backgroundColor: 'lightgray',
      }}>
      <Ionicons
        name="image"
        color="gray"
        size={45}
        style={{alignSelf: 'center'}}
      />
    </View>
  );
};
