/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {StyleSheet} from 'react-native';
import {User, UserRoles, requireLoggedInUser} from '@toolkit/core/api/User';
import {useDataStore} from '@toolkit/data/DataStore';
import DataTable, {
  SortOrder,
  SortState,
} from '@toolkit/ui/components/DataTable';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import EditUserScreen from './EditUserScreen';

type Props = {
  async: {
    users: User[];
  };
};

const DEFAULT_SORT: SortState = {
  col: 'name',
  order: 'asc',
};

const AllUsersScreen: Screen<Props> = (props: Props) => {
  const nav = useNav();
  const {Row, ButtonCell, TextCell} = DataTable;
  const [sort, setSort] = React.useState<SortState>(DEFAULT_SORT);

  function sortUsers() {
    const users = props.async.users;
    const col = sort.col.toLowerCase();
    if (col === 'name') {
      sortByName(users, sort.order);
    } else if (col === 'roles') {
      sortByRoles(users, sort.order);
    }
    return users;
  }

  const users = sortUsers();

  return (
    <DataTable style={S.table}>
      {users.map((user, i) => (
        <Row key={i}>
          <ButtonCell
            title=""
            onPress={() => nav.navTo(EditUserScreen, {userId: user.id})}
            icon="oct:pencil"
            style={{flex: 0.2}}
          />
          <TextCell title="Name" value={user.name} onSort={s => setSort(s)} />
          <TextCell
            title="Email"
            value={user.email ?? ''}
            verified={user.emailVerified ?? false}
          />
          <TextCell
            title="Roles"
            value={getRoles(user)}
            onSort={s => setSort(s)}
          />
        </Row>
      ))}
    </DataTable>
  );
};

const getRoles = (u: User) => {
  return u.roles?.roles.sort().join(', ') ?? '';
};

const sortByName = (users: User[], order: SortOrder) => {
  users.sort((a, b) => {
    return order === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });
};

const sortByRoles = (users: User[], order: SortOrder) => {
  users.sort((a, b) => {
    return order === 'asc'
      ? getRoles(a).localeCompare(getRoles(b))
      : getRoles(b).localeCompare(getRoles(a));
  });
};

AllUsersScreen.title = 'All Users';

AllUsersScreen.load = async () => {
  requireLoggedInUser();
  const userStore = useDataStore(User);
  return {users: await userStore.getAll({edges: [UserRoles]})};
};

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default AllUsersScreen;
