/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import Role from '@toolkit/core/api/Roles';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import {Updater, useDataStore} from '@toolkit/data/DataStore';
import {Allowlist} from '@toolkit/tbd/Allowlist';
import DataTable from '@toolkit/ui/components/DataTable';
import {Screen} from '@toolkit/ui/screen/Screen';
import * as React from 'react';
import {StyleSheet} from 'react-native';

type Props = {
  async: {
    items: Allowlist[];
  };
};

const AllowlistScreen: Screen<Props> = ({async: {items}}: Props) => {
  const {Row, TextCell, EditableTextCell} = DataTable;

  const allowlistStore = useDataStore(Allowlist);
  const messaging = useUserMessaging();

  function update(
    id: string,
    field: keyof Pick<Allowlist, 'uids' | 'phones' | 'emails' | 'emailREs'>,
    value: string,
  ) {
    try {
      const updateValue: Updater<Allowlist> = {
        id: id,
        [field]: splitString(value),
      };
      allowlistStore.update(updateValue);
      messaging.showMessage('Updated');
    } catch (error) {
      console.error(error);
      messaging.showError('Failed to update');
    }
  }

  function joinStringArray(array?: string[], separator: string = '\n') {
    return array ? array.join(separator) : '';
  }

  function splitString(s: string, separator: string = '\n'): string[] {
    return s.split(separator).filter(v => v !== '');
  }

  return (
    <DataTable style={S.table}>
      {items.map(item => (
        <Row key={item.id}>
          <TextCell title="Role" value={item.id} />
          <EditableTextCell
            title="UID"
            value={joinStringArray(item.uids)}
            onSubmit={(newValue: string) => update(item.id, 'uids', newValue)}
          />
          <EditableTextCell
            title="Phone"
            value={joinStringArray(item.phones)}
            onSubmit={(newValue: string) => update(item.id, 'phones', newValue)}
          />
          <EditableTextCell
            title="Email"
            value={joinStringArray(item.emails)}
            onSubmit={(newValue: string) => update(item.id, 'emails', newValue)}
          />
          <EditableTextCell
            title="Email RegEx"
            value={joinStringArray(item.emailREs)}
            onSubmit={(newValue: string) =>
              update(item.id, 'emailREs', newValue)
            }
          />
        </Row>
      ))}
    </DataTable>
  );
};

AllowlistScreen.title = 'Allowlist';

AllowlistScreen.load = async () => {
  requireLoggedInUser();
  const allowlistStore = useDataStore(Allowlist);
  let allowlists = await allowlistStore.getAll();
  if (allowlists.length === 0) {
    allowlists = await Promise.all(
      Object.values(Role).map(role =>
        allowlistStore.create({
          id: role,
        }),
      ),
    );
  }
  return {
    items: allowlists,
  };
};

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default AllowlistScreen;
