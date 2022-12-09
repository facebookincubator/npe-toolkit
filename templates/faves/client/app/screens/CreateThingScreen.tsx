/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import { Ionicons } from '@expo/vector-icons';
import { useData } from '@toolkit/core/api/DataApi';
import { User } from '@toolkit/core/api/User';
import { useLoggedInUser } from '@toolkit/core/api/User';
import { useNav } from '@toolkit/ui/screen/Nav';
import { Screen } from '@toolkit/ui/screen/Screen';
import Button from '@toolkit/ui/components/legacy/Button';
import { useMessageOnFail } from '@toolkit/core/client/UserMessaging';
import { Opt } from '@toolkit/core/util/Types';
import { AddThing } from 'hax-app-common/AppLogic';
import * as React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

const CreateNewThingScreen: Screen<{}> = () => {
  const [name, setName] = React.useState<string>();
  const [description, setDescription] = React.useState<string>();
  const [imageUrl, setImageUrl] = React.useState<string>();
  const [previewUrl, setPreviewUrl] = React.useState<Opt<string>>();

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
    setSaving(false);
    nav.back();
    nav.setParams({reload: true});
  };

  function urlChange(value: string) {
    setImageUrl(value);
    setPreviewUrl(null);
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
        text="Create Thing"
        size="lg"
        onPress={messageOnFail(saveThing)}
        isLoading={saving}
      />
      <Button
        text="Cancel"
        size="lg"
        secondary={true}
        onPress={() => nav.back()}
      />
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