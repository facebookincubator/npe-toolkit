/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  Button,
  Checkbox,
  List,
  TextInput,
  Title,
  useTheme,
} from 'react-native-paper';
import {
  Role,
  SYSTEM_ROLES,
  User,
  UserRoles,
  requireLoggedInUser,
} from '@toolkit/core/api/User';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import {useDataStore} from '@toolkit/data/DataStore';
import {UserNotFoundError} from '@toolkit/tbd/CommonErrors';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import AllUsersScreen from './AllUsersScreen';

type Props = {userId: string; async: {user: User}};
const EditUserScreen: Screen<Props> = ({async: {user}}: Props) => {
  const [name, setName] = React.useState(user.name);
  const [roles, setRoles] = React.useState(user.roles?.roles ?? []);

  const [saving, setSaving] = React.useState(false);

  const nav = useNav();
  const theme = useTheme();
  const userStore = useDataStore(User);
  const rolesStore = useDataStore(UserRoles);
  const {showError} = useUserMessaging();

  const loggedInUser = requireLoggedInUser();

  const back = () => {
    if (nav.backOk()) {
      nav.back();
    } else {
      nav.navTo(AllUsersScreen, {reload: true});
    }
  };

  const hasUnsavedChanges = () => {
    const nameChanged = user.name !== name;
    const initialRoles = user.roles?.roles ?? [];
    const rolesChanged =
      roles.length !== initialRoles.length ||
      roles.some(r => !initialRoles.includes(r));

    return nameChanged || rolesChanged;
  };

  const save = async () => {
    setSaving(true);
    await Promise.all([
      rolesStore.update({id: user.id, roles}),
      userStore.update({id: user.id, name, roles: {id: user.id}}),
    ]);
    setSaving(false);
    back();
  };

  const nameChanged = (newName: string) => {
    setName(newName);
  };

  const roleToggled = (role: Role) => {
    if (loggedInUser.id === user.id && role === 'ADMIN') {
      showError('You cannot remove your own admin permissions');
      return;
    }

    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const roleCheckboxes = SYSTEM_ROLES.map(role => {
    return (
      <List.Item
        title={role}
        key={role}
        left={props => (
          <Checkbox
            status={roles?.includes(role) ? 'checked' : 'unchecked'}
            onPress={() => roleToggled(role)}
          />
        )}
      />
    );
  });

  return (
    <View style={S.modal}>
      <Title>Edit {user.name}</Title>
      <TextInput
        value={name}
        onChangeText={nameChanged}
        mode="outlined"
        label="Name"
        style={{height: 40, marginTop: 10, width: 450}}
      />
      <List.Section>
        <List.Accordion
          title="Roles"
          description={roles?.join(', ') ?? null}
          style={{paddingHorizontal: 0}}>
          {roleCheckboxes}
        </List.Accordion>
      </List.Section>
      <View style={S.modalFooter}>
        <Button onPress={back}>Cancel</Button>
        <Button
          onPress={save}
          loading={saving}
          disabled={!hasUnsavedChanges() || saving}
          mode="contained"
          dark={theme.dark}
          style={{backgroundColor: theme.colors.primary}}>
          Save
        </Button>
      </View>
    </View>
  );
};

EditUserScreen.load = async ({userId}) => {
  const userStore = useDataStore(User);
  const user = await userStore.get(userId, {edges: [UserRoles]});
  if (user == null) {
    throw UserNotFoundError(
      `Couldn't find user with ID ${userId} for EditUserScreen`,
    );
  }

  return {user};
};

EditUserScreen.title = 'Edit User';

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
});

EditUserScreen.style = {
  type: 'modal',
  nav: 'none',
};

export default EditUserScreen;
