/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React from 'react';
import {ViewStyle} from 'react-native';
import {Fave, Thing} from 'hax-app-common/DataTypes';
import {AddFave, RemoveThing} from 'hax-app-common/AppLogic';
import {View, Text, Image, Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useDataStore} from '@toolkit/data/DataStore';
import {useReload} from '@toolkit/util/client/Reload';
import {useData} from '@toolkit/core/api/DataApi';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';

import {useMessageOnFail} from '@toolkit/core/client/UserMessaging';
import PressableSpring from '@toolkit/ui/components/legacy/PressableSpring';
import {SEND_FAVE_NOTIF, SEND_THING_DELETE_NOTIF} from 'hax-app-common/Api';

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