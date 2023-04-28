/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, RadioButton, Text, Title, useTheme} from 'react-native-paper';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useUserMessaging} from '@toolkit/core/client/Status';
import {useDataStore} from '@toolkit/data/DataStore';
import {API_DELETION_RUN_JOB} from '@toolkit/experimental/deletion/DeletionApi';
import {
  DELETED,
  REASON_ROOT,
} from '@toolkit/experimental/deletion/datastore/deletion';
import DeletedScreen from '@toolkit/experimental/deletion/screens/Deleted';
import DryrunScreen from '@toolkit/experimental/deletion/screens/DeletionDryRun';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';
import {NotFoundError} from '@toolkit/tbd/CommonErrors';
import {alert} from '@toolkit/ui/components/Tools';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

type Props = {id: string; async: {deleted: DELETED}};
type Action = 'remove' | 'restore' | 'restore-dryrun' | '';

const EditDeletedScreen: Screen<Props> = ({async: {deleted}}: Props) => {
  requireLoggedInUser();

  const nav = useNav();
  const theme = useTheme();
  const deletedStore = useDataStore(DELETED);
  const messaging = useUserMessaging();
  const runJobApi = useApi(API_DELETION_RUN_JOB);

  const [action, setAction] = React.useState<Action>('');
  const [submitting, setSubmitting] = React.useState(false);

  const back = (reload?: boolean) => {
    if (!reload && nav.backOk()) {
      nav.back();
    } else {
      nav.navTo(DeletedScreen, {reload: true});
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    if (action === 'remove') {
      alert('Are you sure?', 'The object will deleted permanently.', [
        {
          onPress: async () => {
            await deletedStore.remove(deleted.id);
            back(true);
          },
        },
      ]);
    } else if (action === 'restore') {
      messaging.showMessage(`Submitting a restore job for ${deleted.id}`);
      await runJobApi({
        type: 'initiateRestoration',
        input: {
          modelName: deleted.modelName,
          modelId: deleted.modelId,
          reason: REASON_ROOT,
        },
      });
      back(true);
    } else if (action === 'restore-dryrun') {
      back(false);
      nav.navTo(DryrunScreen, {
        runType: 'restore',
        modelName: deleted.modelName,
        modelId: deleted.modelId,
        run: true,
      });
    }
    setSubmitting(false);
  };

  return (
    <View style={S.modal}>
      <Title>
        "{deleted.modelName}-{deleted.modelId}"
      </Title>
      <View
        style={{
          alignContent: 'space-between',
          marginTop: 20,
        }}>
        <ScrollView
          style={[
            S.modelDataView,
            {borderRadius: theme.roundness, borderColor: theme.colors.disabled},
          ]}>
          <Text>{JSON.stringify(deleted.modelData, null, 2)}</Text>
        </ScrollView>
        <RadioButton.Group
          onValueChange={newValue => setAction(newValue as Action)}
          value={action}>
          <View style={S.radioOption}>
            <RadioButton value="remove" />
            <Text>Delete Permanently</Text>
          </View>
          {deleted.status === 'FINISHED' && (
            <>
              <View style={S.radioOption}>
                <RadioButton value="restore" />
                <Text>Restore</Text>
              </View>
              <View style={S.radioOption}>
                <RadioButton value="restore-dryrun" />
                <Text>Restore (Dryrun)</Text>
              </View>
            </>
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

EditDeletedScreen.load = async ({id}) => {
  const messaging = useUserMessaging();
  const deletedStore = useDataStore(DELETED);
  const deleted = await deletedStore.get(id);
  if (deleted == null) {
    const error = NotFoundError();
    // TODO: How to show error and nav back.
    messaging.showError(error);
    throw error;
  }
  return {deleted};
};

EditDeletedScreen.title = 'Edit DELETED';

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
  modelDataView: {
    maxHeight: 100,
    maxWidth: 600,
    borderWidth: 1,
    padding: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

EditDeletedScreen.style = {
  type: 'modal',
  nav: 'none',
};

export default EditDeletedScreen;
