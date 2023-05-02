/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Checkbox} from 'react-native-paper';
import {Role, SYSTEM_ROLES, requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {CodedError} from '@toolkit/core/util/CodedError';
import {Opt} from '@toolkit/core/util/Types';
import {getRequired, useDataStore} from '@toolkit/data/DataStore';
import {AllowlistEntry} from '@toolkit/tbd/Allowlist';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import AllowlistScreen, {formatKey, rolesEqual} from './Allowlist';

type Props = {
  id?: string;
  async: {
    entry: Opt<AllowlistEntry>;
  };
};
const AllowlistEdit: Screen<Props> = (props: Props) => {
  const {id} = props;
  const nav = useNav();
  const {entry} = props.async;
  const {Subtitle, Button} = useComponents();
  const [UserKeyInput, userKey] = useTextInput(formatKey(entry?.userKey ?? ''));
  const [roles, setRoles] = React.useState(entry?.roles ?? []);
  const [onSave, saving] = useAction(save);
  const allowlistStore = useDataStore(AllowlistEntry);

  const title = entry ? 'Edit Allowlist Entry' : 'New Allowlist Entry';

  function onEdit(newRoles: Role[]) {
    setRoles(newRoles);
  }

  function back(reload: boolean = false) {
    if (nav.backOk()) {
      nav.back();
      nav.setParams({reload});
    } else {
      nav.navTo(AllowlistScreen, {reload});
    }
  }

  function hasChanged() {
    return (
      (entry?.userKey ?? '') !== userKey ||
      !rolesEqual(entry?.roles ?? [], roles)
    );
  }

  function isValidPhoneOrEmail() {
    const digits = userKey.replace(/[^\d]/g, '');
    return (
      (userKey.match(/^[0-9\s\-\+\(\)]+$/) && digits.length >= 10) ||
      userKey.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    );
  }

  function saveOk() {
    return isValidPhoneOrEmail() && hasChanged();
  }

  async function save() {
    if (!saveOk()) {
      return;
    }
    let saveKey = userKey;
    if (userKey.match(/[+\d]+/)) {
      // Remove all non-digit characters except for the optional "+" in front of the country code
      saveKey = userKey.replace(/[^\d+]/g, '');
      if (saveKey.indexOf('+') !== 0) {
        saveKey = '+1' + saveKey;
      }
    }
    if (entry == null) {
      const existing = await allowlistStore.get(userKey);
      if (existing) {
        throw new CodedError(
          'npe.adhoc',
          'This allowlist entry already exists.',
        );
      }
      const id = 'allowlist:' + saveKey;
      await allowlistStore.create({id, userKey: saveKey, roles});
    } else {
      await allowlistStore.update({id: entry.id, userKey: saveKey, roles});
    }
    back(true);
  }

  return (
    <View style={S.modal}>
      <Subtitle style={{fontWeight: 'bold'}}>{title}</Subtitle>
      <UserKeyInput label="Email or Phone" type="primary" style={S.input} />
      <Subtitle>Roles</Subtitle>
      <RoleEditor roles={roles} onEdit={onEdit} />
      <View style={S.modalFooter}>
        <Button type="tertiary" onPress={() => back(false)}>
          Cancel
        </Button>
        <Button
          type="primary"
          onPress={onSave}
          disabled={!saveOk()}
          loading={saving}>
          Save
        </Button>
      </View>
    </View>
  );
};

type RoleEditorProps = {
  appRoles?: Role[];
  roles: Role[];
  onEdit: (roles: Role[]) => void;
};

export const RoleEditor = (props: RoleEditorProps) => {
  const {appRoles = [], roles, onEdit} = props;
  const allRoles = [...SYSTEM_ROLES, ...appRoles];
  const {Body} = useComponents();

  function roleToggled(role: Role) {
    let newRoles;
    if (roles.includes(role)) {
      newRoles = roles.filter(r => r !== role);
    } else {
      newRoles = [...roles, role];
    }
    onEdit(newRoles);
  }

  function format(role: Role) {
    return role.slice(0, 1).toUpperCase() + role.slice(1).toLowerCase();
  }

  return (
    <View>
      {allRoles.map(role => (
        <Pressable
          key={role}
          style={S.roleRow}
          onPress={() => roleToggled(role)}>
          <Checkbox status={roles.includes(role) ? 'checked' : 'unchecked'} />
          <Body>{format(role)}</Body>
        </Pressable>
      ))}
    </View>
  );
};

AllowlistEdit.title = 'Edit Allowlist';

AllowlistEdit.style = {
  type: 'modal',
  nav: 'none',
};

AllowlistEdit.load = async props => {
  const {id} = props;
  requireLoggedInUser();
  const allowlistStore = useDataStore(AllowlistEntry);
  const entry = id != null ? await getRequired(allowlistStore, id) : null;

  return {entry};
};

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: 'auto',
    height: 'auto',
    alignSelf: 'center',
    borderRadius: 7,
    minWidth: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    marginTop: 20,
  },
  input: {
    marginVertical: 12,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AllowlistEdit;
