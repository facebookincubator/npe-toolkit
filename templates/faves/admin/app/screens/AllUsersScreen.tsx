/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import * as React from 'react';
import {StyleSheet, Text} from 'react-native';

import {User, UserRoles} from '@npe/lib/core/User';
import {useDataStore} from '@npe/lib/data/DataStore';
import {Screen} from '@npe/lib/screen/Screen';

import DataTable, {SortOrder} from '@npe/lib/paper/DataTable';
import {useNav} from '@npe/lib/screen/Nav';
import EditUserScreen from './EditUserScreen';
import {requireLoggedInUser} from '@npe/lib/core/UserContext';

type Props = {
  async: {
    users: User[];
  };
};

const AllUsersScreen: Screen<Props> = ({async: {users: initUsers}}: Props) => {
  const nav = useNav();
  const [users, setUsers] = React.useState(initUsers);

  const {Row, ButtonCell, TextCell} = DataTable;

  const getRoles = (u: User) => {
    return u.roles?.roles.sort().join(', ') ?? '';
  };

  const sortByName = (order: SortOrder) => {
    const sorted = users.sort((a, b) => {
      return order === 'ascending'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    setUsers([...sorted]);
  };

  const sortByRoles = (order: SortOrder) => {
    const sorted = users.sort((a, b) => {
      return order === 'ascending'
        ? getRoles(a).localeCompare(getRoles(b))
        : getRoles(b).localeCompare(getRoles(a));
    });
    setUsers([...sorted]);
  };

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
          <TextCell title="ID" value={user.id} />
          <TextCell title="Name" value={user.name} onSort={sortByName} />
          <TextCell
            title="Email"
            value={user.email ?? ''}
            verified={user.emailVerified ?? false}
          />
          <TextCell title="Roles" value={getRoles(user)} onSort={sortByRoles} />
        </Row>
      ))}
    </DataTable>
  );
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
