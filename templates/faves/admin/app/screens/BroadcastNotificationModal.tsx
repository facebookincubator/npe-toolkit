/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Title, TextInput, useTheme} from 'react-native-paper';

import {useApi} from '@npe/lib/firebase/FirebaseFunctionsProvider';
import {useNav} from '@npe/lib/screen/Nav';
import {Screen} from '@npe/lib/screen/Screen';

import {BROADCAST_ADMIN_NOTIF} from 'hax-app-common/Api';
import Banner from '@npe/lib/ui/Banner';

const BroadcastNotificationModal: Screen<{}> = () => {
  const [notifTitle, setNotifTitle] = React.useState('');
  const [notifBody, setNotifBody] = React.useState('');
  const [sendingNotif, setSendingNotif] = React.useState(false);

  const theme = useTheme();
  const nav = useNav();
  const sendBroadcast = useApi(BROADCAST_ADMIN_NOTIF);

  const sendNotif = async () => {
    setSendingNotif(true);
    await sendBroadcast({
      title: notifTitle,
      body: notifBody,
    });
    setSendingNotif(false);
    nav.back();
  };

  return (
    <View style={S.modal}>
      <Title>Send Push to all users</Title>
      <Banner
        iconProps={{name: 'ion:warning', color: 'white'}}
        color="#eed202"
        text="This will send a push notification to all users. Please use carefully"
      />
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
          disabled={notifBody === '' || sendingNotif}
          mode="contained"
          dark={theme.dark}
          style={{backgroundColor: theme.colors.primary}}>
          Send
        </Button>
      </View>
    </View>
  );
};

BroadcastNotificationModal.style = {
  type: 'modal',
  nav: 'none',
};

const S = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: 550,
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

export default BroadcastNotificationModal;
