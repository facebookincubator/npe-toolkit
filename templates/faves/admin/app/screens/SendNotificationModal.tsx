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
import {Button, TextInput, Title, useTheme} from 'react-native-paper';
import {User} from '@toolkit/core/api/User';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {SEND_ADMIN_NOTIF} from '@app/common/Api';

type Props = {user: User};
const SendNotificationModal: Screen<Props> = ({user}: Props) => {
  const [notifTitle, setNotifTitle] = React.useState('');
  const [notifBody, setNotifBody] = React.useState('');
  const [sendingNotif, setSendingNotif] = React.useState(false);

  const theme = useTheme();
  const nav = useNav();
  const msg = useUserMessaging();
  const sendAdminNotif = useApi(SEND_ADMIN_NOTIF);

  const sendNotif = async () => {
    if (notifBody == '') {
      msg.showError('Notification body cannot be empty');
      return;
    }

    setSendingNotif(true);
    await sendAdminNotif({
      user,
      title: notifTitle,
      body: notifBody,
    });
    setSendingNotif(false);
    nav.back();
  };

  return (
    <View style={S.modal}>
      <Title>Send Push to {user.name}</Title>
      <TextInput
        value={notifTitle}
        onChangeText={setNotifTitle}
        mode="outlined"
        label="Title"
        style={{height: 40, marginTop: 10}}
      />
      <TextInput
        value={notifBody}
        onChangeText={setNotifBody}
        mode="outlined"
        label="Body"
        style={{height: 40, marginTop: 10}}
      />
      <View style={S.modalFooter}>
        <Button onPress={nav.back}>Cancel</Button>
        <Button
          onPress={sendNotif}
          loading={sendingNotif}
          disabled={sendingNotif}
          mode="contained"
          dark={theme.dark}
          style={{backgroundColor: theme.colors.primary}}>
          Send
        </Button>
      </View>
    </View>
  );
};

SendNotificationModal.style = {
  type: 'modal',
  nav: 'none',
};

const S = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: 500,
    height: 250,
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

export default SendNotificationModal;
