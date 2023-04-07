/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {StyleSheet} from 'react-native';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useDataStore} from '@toolkit/data/DataStore';
import {DELETED} from '@toolkit/experimental/deletion/datastore/deletion';
import EditDeletedScreen from '@toolkit/experimental/deletion/screens/EditDeleted';
import DataTable from '@toolkit/ui/components/DataTable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

type Props = {
  async: {
    items: DELETED[];
  };
};

const DeletedScreen: Screen<Props> = ({async: {items}}: Props) => {
  const nav = useNav();
  const {Row, ButtonCell, TextCell} = DataTable;

  return (
    <DataTable style={S.table}>
      {items.map((item, i) => (
        <Row key={i}>
          <ButtonCell
            title=""
            onPress={() => nav.navTo(EditDeletedScreen, {id: item.id})}
            icon={'ion:ellipsis-vertical'}
            style={{maxWidth: 100}}
          />
          <TextCell
            title="Model"
            value={item.modelName}
            style={{maxWidth: 150}}
          />
          <TextCell title="ID" value={item.modelId} />
          <TextCell
            title="CreatedAt"
            value={
              item.createdAt ? new Date(item.createdAt).toLocaleString() : ''
            }
            style={{maxWidth: 250}}
          />
          <TextCell
            title="UpdatedAt"
            value={
              item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''
            }
            style={{maxWidth: 250}}
          />
          <TextCell
            title="Status"
            value={item.status}
            style={{maxWidth: 100}}
          />
          <TextCell title="Reasons" value={item.reasons.join('\n')} />
        </Row>
      ))}
    </DataTable>
  );
};

DeletedScreen.title = 'Deleted Objects';

DeletedScreen.load = async () => {
  requireLoggedInUser();
  const deletedStore = useDataStore(DELETED);
  return {items: await deletedStore.getAll()};
};

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default DeletedScreen;
