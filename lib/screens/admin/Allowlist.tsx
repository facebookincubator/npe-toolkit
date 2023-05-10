/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {format as formatPhone, parse as parsePhone} from 'libphonenumber-js';
import {Role, requireLoggedInUser} from '@toolkit/core/api/User';
import {actionHook, useAction} from '@toolkit/core/client/Action';
import {useReload} from '@toolkit/core/client/Reload';
import {CodedError} from '@toolkit/core/util/CodedError';
import {useDataStore} from '@toolkit/data/DataStore';
import {AllowlistEntry} from '@toolkit/tbd/Allowlist';
import {useComponents} from '@toolkit/ui/components/Components';
import DataTable from '@toolkit/ui/components/DataTable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import AllowlistEdit from './AllowlistEdit';

type Props = {
  async: {
    entries: AllowlistEntry[];
  };
};

const AllowlistScreen: Screen<Props> = ({async: {entries}}: Props) => {
  const {Row, TextCell, ButtonCell} = DataTable;
  const {navTo} = useNav();
  const allowlistStoreNew = useDataStore(AllowlistEntry);
  const reload = useReload();
  const [onDelete] = useAction('AllowlistDelete', deleteEntry);
  const {Body} = useComponents();

  async function deleteEntry(entry: AllowlistEntry) {
    const adminCount = entries.filter(e => e.roles.includes('admin')).length;
    if (adminCount == 1 && entry.roles.includes('admin')) {
      throw new CodedError(
        'npe.adhoc',
        'You are not allowed to delete last admin',
      );
    }
    await allowlistStoreNew.remove(entry.id);
    reload();
  }

  function fixed(width: number) {
    return {flexBasis: width, flexShrink: 0};
  }

  function grow() {
    return {flexGrow: 100, flexBasis: 100};
  }

  if (entries.length === 0) {
    return (
      <View style={{padding: 32}}>
        <Body>
          No allowlist entries have been created yet. Click on the plus button
          to create one.
        </Body>
      </View>
    );
  }

  return (
    <DataTable style={S.table}>
      {entries.map(entry => {
        const {id, roles, userKey} = entry;
        const keyStr = formatKey(userKey);
        const roleStr = formatRoles(roles);
        const KEY_TITLE = 'Email or Phone #';
        return (
          <Row key={entry.userKey} onPress={() => navTo(AllowlistEdit, {id})}>
            <TextCell title={KEY_TITLE} value={keyStr} style={fixed(200)} />
            <TextCell title="Roles" value={roleStr} style={grow()} />
            <ButtonCell
              title=""
              icon="delete"
              onPress={() => onDelete(entry)}
              style={fixed(40)}
            />
          </Row>
        );
      })}
    </DataTable>
  );
};

AllowlistScreen.title = 'Allowlist';

AllowlistScreen.mainAction = {
  id: 'allowlist-add',
  icon: 'plus',
  action: actionHook(() => {
    const {navTo} = useNav();
    return () => navTo(AllowlistEdit);
  }),
  label: 'Add entry',
};

AllowlistScreen.load = async () => {
  requireLoggedInUser();
  const allowlistStore = useDataStore(AllowlistEntry);

  return {
    entries: await allowlistStore.getAll(),
  };
};

// TODO: Move functions below to common Role utils
export function formatKey(key: string) {
  if (key.match(/^[0-9\s\-\+\(\)]+$/)) {
    return formatPhone(parsePhone(key, 'US'), 'NATIONAL');
  }
  return key;
}

export function rolesEqual(lhs: Role[], rhs: Role[]) {
  return formatRoles(lhs) === formatRoles(rhs);
}

export function formatRoles(roles: Role[]) {
  const formatted = roles.map(role => formatRole(role));

  return formatted.sort((a, b) => a.localeCompare(b)).join(', ');
}

export function formatRole(role: Role) {
  return role.slice(0, 1).toUpperCase() + role.slice(1).toLowerCase();
}

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default AllowlistScreen;
