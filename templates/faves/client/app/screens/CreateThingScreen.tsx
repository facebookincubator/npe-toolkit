/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {TextInput} from 'react-native-paper';
import {useData} from '@toolkit/core/api/DataApi';
import {User} from '@toolkit/core/api/User';
import {useLoggedInUser} from '@toolkit/core/api/User';
import {useMessageOnFail} from '@toolkit/core/client/UserMessaging';
import {sleep} from '@toolkit/core/util/DevUtil';
import {Opt} from '@toolkit/core/util/Types';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import AllThingsScreen from '@app/app/screens/AllThingsScreen';
import {AddThing} from '@app/common/AppLogic';

const CreateNewThingScreen: Screen<{}> = () => {
  const [name, setName] = React.useState<string>();
  const [description, setDescription] = React.useState<string>();
  const [imageUrl, setImageUrl] = React.useState<string>();
  const [previewUrl, setPreviewUrl] = React.useState<Opt<string>>();
  const {Button} = useComponents();

  const [saving, setSaving] = React.useState<boolean>(false);

  const user = useLoggedInUser<User>();
  const addThing = useData(AddThing);
  const nav = useNav();
  const messageOnFail = useMessageOnFail();

  const saveThing = async () => {
    if (name == null || description == null) {
      alert('Name and description  are required');
      return;
    }

    // Shouldn't happen. Basically just type refinement
    if (user == null) {
      alert('Must be logged in to do this.');
      return;
    }
    setSaving(true);
    await addThing({name, description, imageUrl, creator: user});
    await sleep(5000);
    setSaving(false);
    back();
    nav.setParams({reload: true});
  };

  function urlChange(value: string) {
    setImageUrl(value);
    setPreviewUrl(null);
  }

  function back() {
    // TODO: We should create the back stack when deep navigating to CreateThingScreen
    // But for now we need to navigate back to main screen if it doesn't exist
    if (nav.backOk()) {
      nav.back();
    } else {
      nav.navTo(AllThingsScreen);
    }
  }

  return (
    <View style={[S.center, {flex: 1, padding: 20}]}>
      <TextInput
        label="Name"
        mode="flat"
        value={name}
        onChangeText={setName}
        style={S.textInput}
      />
      <TextInput
        label="Description"
        mode="flat"
        value={description}
        onChangeText={setDescription}
        style={S.textInput}
      />
      <TextInput
        label="Image URL"
        mode="flat"
        value={imageUrl}
        onChangeText={urlChange}
        onBlur={() => setPreviewUrl(imageUrl)}
        selectTextOnFocus={true}
        style={S.textInput}
        textContentType="URL"
        autoCapitalize="none"
      />
      {previewUrl == null || previewUrl === '' ? (
        <ImagePlaceholder />
      ) : (
        <Image source={{uri: previewUrl}} style={S.image} />
      )}

      <Button
        type="primary"
        onPress={messageOnFail(saveThing)}
        loading={saving}
        disabled={saving}>
        Create Thing
      </Button>
      <Button type="tertiary" onPress={back} disabled={saving}>
        Cancel
      </Button>
    </View>
  );
};

const ImagePlaceholder = () => {
  return (
    <View style={[S.image, S.center]}>
      <Ionicons
        name="image"
        color="gray"
        size={100}
        style={{alignSelf: 'center'}}
      />
    </View>
  );
};

CreateNewThingScreen.title = 'Create New Thing';

const S = StyleSheet.create({
  center: {
    alignContent: 'center',
  },
  textInput: {
    marginTop: 10,
    paddingHorizontal: 0,
    fontSize: 24,
    backgroundColor: 'rgba(255,255,255,0)',
  },
  image: {
    alignSelf: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
    borderRadius: 10,
    marginVertical: 40,
    backgroundColor: 'lightgray',
  },
});

export default CreateNewThingScreen;
