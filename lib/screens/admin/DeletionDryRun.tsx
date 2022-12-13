/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall npe_central_engineering
 */

import * as React from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {
  Button,
  Divider,
  Headline,
  ProgressBar,
  RadioButton,
  Text,
  Title,
  useTheme,
} from 'react-native-paper';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {BaseModel, ModelUtil, registry} from '@toolkit/data/DataStore';
import {
  API_DELETION_DRYRUN_DELETION,
  API_DELETION_DRYRUN_RESTORATION,
} from '@toolkit/data/DeletionApi';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import CodedError from '@toolkit/core/util/CodedError';
import {SYSTEM_MODELS} from '@toolkit/screens/admin/Common';

type DryRunType = 'delete' | 'restore';
type Props = {
  runType?: DryRunType;
  modelId?: string;
  modelName?: string;
  run?: boolean;
};

const DryrunScreen: Screen<Props> = (props: Props) => {
  requireLoggedInUser();
  const theme = useTheme();

  const nav = useNav();
  const messaging = useUserMessaging();

  const dryrunRestoreApi = useApi(API_DELETION_DRYRUN_RESTORATION);
  const dryrunDeleteApi = useApi(API_DELETION_DRYRUN_DELETION);

  const [runType, setRunType] = React.useState<DryRunType | ''>(
    props.runType || '',
  );
  const [modelName, setModelName] = React.useState(props.modelName || '');
  const [ModelIdInput, modelId] = useTextInput(props.modelId || '');
  const [runReslut, setRunResult] = React.useState('');
  const [running, setRunning] = React.useState(false);

  const modelNames = registry
    .getAllModels()
    .map(m => ModelUtil.getName(m))
    .filter(m => !SYSTEM_MODELS.includes(m))
    .sort();

  React.useEffect(() => {
    if (props.run) {
      runDryrun();
    }
  }, []);

  async function runDryrun() {
    try {
      setRunResult('');
      setRunning(true);

      if (!runType || !modelName || !modelId) {
        messaging.showError('Enter all inputs.');
        return;
      }

      messaging.showMessage(
        `Starting dryrun: ${runType}-${modelName}-${modelId}. This may take a while.`,
      );

      let result: BaseModel[];
      if (runType === 'delete') {
        result = await dryrunDeleteApi({
          modelId,
          modelName,
        });
      } else if (runType === 'restore') {
        result = await dryrunRestoreApi({
          modelId,
          modelName,
        });
      } else {
        messaging.showError(`Unknown runtype ${runType}.`);
        return;
      }
      const outputs = [];
      outputs.push(`${runType}d ${result.length} object(s):`);
      result.forEach((o, i) => {
        outputs.push('\n' + (i + 1) + '.');
        outputs.push(JSON.stringify(o, null, 2));
      });
      setRunResult(outputs.join('\n'));
    } catch (err: any) {
      console.error(err);
      err instanceof CodedError
        ? messaging.showError(err.userVisibleMessage)
        : messaging.showError('Dryrun failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <View style={[S.modal, {borderRadius: theme.roundness}]}>
      <View style={S.modalSection}>
        <Headline>Dryrun</Headline>
        <Divider style={{backgroundColor: theme.colors.disabled}} />
      </View>
      <View
        style={{
          ...S.modalSection,
          flexDirection: 'row',
        }}>
        <View style={S.formColumn}>
          <Title>Run Type</Title>
          <RadioButton.Group
            onValueChange={value => {
              setRunType(value as DryRunType);
            }}
            value={runType}>
            <View style={S.radioOption}>
              <RadioButton value="delete" />
              <Text>Delete</Text>
            </View>
            <View style={S.radioOption}>
              <RadioButton value="restore" />
              <Text>Restore</Text>
            </View>
          </RadioButton.Group>
        </View>
        <View style={S.formColumn}>
          <Title>Model Name</Title>
          <RadioButton.Group
            onValueChange={value => {
              setModelName(value);
            }}
            value={modelName}>
            {modelNames.map(modelName => (
              <View style={S.radioOption} key={modelName}>
                <RadioButton value={modelName} />
                <Text>{modelName}</Text>
              </View>
            ))}
          </RadioButton.Group>
        </View>
        <View style={S.formColumn}>
          <Title>Model ID</Title>
          <ModelIdInput style={{backgroundColor: 'white', borderWidth: 1}} />
        </View>
      </View>
      <View
        style={{
          ...S.modalSection,
          flexDirection: 'row-reverse',
          margin: 20,
        }}>
        <View style={{flexDirection: 'row'}}>
          <Button onPress={nav.back}>Cancel</Button>
          <Button mode="contained" onPress={runDryrun} disabled={running}>
            Run
          </Button>
        </View>
      </View>
      <View style={S.modalSection}>
        {running && <ProgressBar progress={0.5} indeterminate={true} />}
        {runReslut !== '' && (
          <ScrollView
            style={{
              borderWidth: 1,
              borderRadius: theme.roundness,
              borderColor: theme.colors.disabled,
            }}>
            <Text>{runReslut}</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

DryrunScreen.title = 'Dryrun';
DryrunScreen.style = {
  type: 'modal',
};

const S = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalSection: {
    padding: 10,
  },
  formColumn: {
    minWidth: 200,
    padding: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DryrunScreen;
