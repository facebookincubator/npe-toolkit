/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';

import {User} from '@npe/lib/core/User';
import {useDataStore} from '@npe/lib/data/DataStore';
import {useNav} from '@npe/lib/screen/Nav';
import {Screen} from '@npe/lib/screen/Screen';

import DataTable from '@npe/lib/paper/DataTable';
import SendNotificationModal from './SendNotificationModal';
import {requireLoggedInUser} from '@npe/lib/core/UserContext';
import BroadcastNotificationModal from './BroadcastNotificationModal';

type Props = {
  async: {
    users: User[];
  };
};

const NotificationsScreen: Screen<Props> = ({async: {users}}: Props) => {
  const nav = useNav();
  const {Row, TextCell, ButtonCell} = DataTable;

  return (
    <DataTable style={S.table}>
      {users.map((user, i) => (
        <Row key={i}>
          <TextCell title="ID" value={user.id} />
          <TextCell title="Name" value={user.name} />
          <ButtonCell
            title="Notify"
            label="Send Push"
            onPress={() => nav.navTo(SendNotificationModal, {user})}
          />
        </Row>
      ))}
    </DataTable>
  );
};

NotificationsScreen.title = 'Notifications';

NotificationsScreen.load = async () => {
  requireLoggedInUser();
  const userStore = useDataStore(User);
  return {users: await userStore.getAll()};
};

const SHOW_BROADCAST_MODAL_ACTION = () => {
  const nav = useNav();
  return {
    id: 'showBroadcastModal',
    label: 'Send Broadcast',
    icon: 'oct:megaphone',
    act: () => nav.navTo(BroadcastNotificationModal),
  };
};

NotificationsScreen.actions = [SHOW_BROADCAST_MODAL_ACTION];

const S = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default NotificationsScreen;
