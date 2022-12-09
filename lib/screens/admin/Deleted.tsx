/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import {requireLoggedInUser} from '@toolkit/core/api/User';
import {DELETED, useDataStore} from '@toolkit/data/DataStore';
import EditDeletedScreen from '@toolkit/screens/admin/EditDeleted';
import DataTable from '@toolkit/ui/components/DataTable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import * as React from 'react';
import {StyleSheet} from 'react-native';

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