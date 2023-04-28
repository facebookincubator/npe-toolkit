/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, RadioButton, Text, Title, useTheme} from 'react-native-paper';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useUserMessaging} from '@toolkit/core/client/Status';
import {useDataStore} from '@toolkit/data/DataStore';
import {TODELETE} from '@toolkit/experimental/deletion/datastore/deletion';
import ToDeleteScreen from '@toolkit/experimental/deletion/screens/Deletion';
import {NotFoundError} from '@toolkit/tbd/CommonErrors';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {alert} from '@toolkit/ui/components/Tools';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

type Props = {id: string; async: {todelete: TODELETE}};
type Action = 'remove' | 'edit' | '';

const EditToDeleteScreen: Screen<Props> = ({async: {todelete}}: Props) => {
  requireLoggedInUser();

  const nav = useNav();
  const theme = useTheme();
  const messaging = useUserMessaging();
  const todeleteStore = useDataStore(TODELETE);

  const [action, setAction] = React.useState<Action>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [DeletedAtInput, deletedAt] = useTextInput(
    new Date(todelete.deleteAt).toLocaleString(),
  );

  const back = (reload?: boolean) => {
    if (!reload && nav.backOk()) {
      nav.back();
    } else {
      nav.navTo(ToDeleteScreen, {reload: true});
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    if (action === 'remove') {
      alert('Are you sure?', 'The object will be no longer deleted by TTL.', [
        {
          onPress: async () => {
            await todeleteStore.remove(todelete.id);
            back(true);
          },
        },
      ]);
    } else if (action === 'edit') {
      const newDeletedAt = Date.parse(deletedAt);
      if (!newDeletedAt) {
        messaging.showError(`Invalid time "${deletedAt}"`);
        return;
      }
      await todeleteStore.update({
        id: todelete.id,
        deleteAt: newDeletedAt,
      });
      back(true);
    }
    setSubmitting(false);
  };

  return (
    <View style={S.modal}>
      <Title>
        "{todelete.modelName}-{todelete.modelId}"
      </Title>
      <View
        style={{
          alignContent: 'space-between',
          marginTop: 20,
        }}>
        <RadioButton.Group
          onValueChange={newValue => setAction(newValue as Action)}
          value={action}>
          <View style={S.radioOption}>
            <RadioButton value="remove" />
            <Text>Remove TTL</Text>
          </View>
          {todelete.status === 'INIT' && (
            <View style={S.radioOption}>
              <RadioButton value="edit" />
              <Text>Change DeletedAt</Text>
              <DeletedAtInput
                style={{
                  height: 40,
                  marginLeft: 10,
                  paddingLeft: 5,
                  width: 200,
                  borderWidth: 1,
                }}
                onFocus={() => {
                  setAction('edit');
                }}
              />
            </View>
          )}
        </RadioButton.Group>
      </View>
      <View style={S.modalFooter}>
        <Button onPress={back}>Cancel</Button>
        <Button
          mode="contained"
          loading={submitting}
          disabled={!action || submitting}
          onPress={onSubmit}
          dark={theme.dark}
          style={{backgroundColor: theme.colors.primary}}>
          Submit
        </Button>
      </View>
    </View>
  );
};

EditToDeleteScreen.load = async ({id}) => {
  const messaging = useUserMessaging();
  const toDeleteStore = useDataStore(TODELETE);
  const todelete = await toDeleteStore.get(id);
  if (todelete == null) {
    const error = NotFoundError();
    messaging.showError(error);
    throw error;
  }
  return {todelete};
};

EditToDeleteScreen.title = 'Edit TODELETE';

const S = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: 'auto',
    height: 'auto',
    alignSelf: 'center',
    borderRadius: 7,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    marginTop: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

EditToDeleteScreen.style = {
  type: 'modal',
  nav: 'none',
};

export default EditToDeleteScreen;
