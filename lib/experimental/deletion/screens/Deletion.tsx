/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useDataStore} from '@toolkit/data/DataStore';
import {TODELETE} from '@toolkit/experimental/deletion/datastore/deletion';
import {SYSTEM_MODELS} from '@toolkit/screens/admin/Common';
import EditToDeleteScreen from '@toolkit/experimental/deletion/screens/EditToDelete';
import DataTable from '@toolkit/ui/components/DataTable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import * as React from 'react';
import {StyleSheet} from 'react-native';

type Props = {
  async: {
    items: TODELETE[];
  };
};

const ToDeleteScreen: Screen<Props> = ({async: {items}}: Props) => {
  const nav = useNav();
  const {Row, TextCell, ButtonCell} = DataTable;

  return (
    <DataTable style={S.table}>
      {items.map((item, i) => (
        <Row key={i}>
          <ButtonCell
            title=""
            onPress={() => nav.navTo(EditToDeleteScreen, {id: item.id})}
            icon={'ion:ellipsis-vertical'}
            style={{flex: 0.15, maxWidth: 100}}
          />
          <TextCell
            title="Model"
            value={item.modelName}
            style={{maxWidth: 150}}
          />
          <TextCell title="ID" value={item.modelId} />
          <TextCell
            title="DeleteAt"
            value={
              item.deleteAt ? new Date(item.deleteAt).toLocaleString() : ''
            }
            style={{maxWidth: 250}}
          />
          <TextCell
            title="Status"
            value={item.status}
            style={{maxWidth: 150}}
          />
        </Row>
      ))}
    </DataTable>
  );
};

ToDeleteScreen.title = 'Expiring Objects (TTL)';

ToDeleteScreen.load = async () => {
  requireLoggedInUser();
  const toDeleteStore = useDataStore(TODELETE);
  return {
    items: await toDeleteStore.getMany({
      query: {
        where: [{field: 'modelName', op: 'not-in', value: SYSTEM_MODELS}],
      },
    }),
  };
};

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ToDeleteScreen;
