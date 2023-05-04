/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {View} from 'react-native';
import {List, Switch} from 'react-native-paper';
import {useUserMessaging} from '@toolkit/core/client/Status';
import {Opt} from '@toolkit/core/util/Types';
import NotificationChannel, {
  useNotificationChannels,
} from '@toolkit/services/notifications/NotificationChannel';
import {
  DeliveryMethod,
  NotificationPref,
} from '@toolkit/services/notifications/NotificationTypes';
import {useNotifications} from '@toolkit/services/notifications/NotificationsClient';
import {Screen} from '@toolkit/ui/screen/Screen';

type ChannelPreference = {
  channel: NotificationChannel;
  preference: Opt<NotificationPref>;
};

export const NotificationAccordion = ({
  channel,
  preference,
}: ChannelPreference) => {
  const [enabled, setEnabled] = React.useState(preference?.enabled ?? true);
  const [selectedDeliveryMethods, setSelectedDeliveryMethods] = React.useState(
    preference?.deliveryMethods ?? [channel.defaultDeliveryMethod],
  );

  const {setNotificationPrefs} = useNotifications();
  const {showError} = useUserMessaging();

  async function setDeliveryMethodEnabled(
    method: DeliveryMethod,
    enabled: boolean,
  ) {
    const oldSelectedMethods = [...selectedDeliveryMethods];
    const selectedMethods = enabled
      ? selectedDeliveryMethods.concat(method)
      : selectedDeliveryMethods.filter(m => m !== method);

    setSelectedDeliveryMethods(selectedMethods);

    try {
      const newPrefs = await setNotificationPrefs(channel, {
        enabled,
        deliveryMethods: selectedMethods,
      });

      // Update UI with server values. These can be different if the user is
      // setting these on two different devices.
      setSelectedDeliveryMethods(newPrefs.deliveryMethods);
    } catch (e) {
      setSelectedDeliveryMethods(oldSelectedMethods);
      showError('Something went wrong. Please try again');
    }
  }

  async function setNotificationEnabled(isEnabled: boolean) {
    setEnabled(isEnabled);
    try {
      await setNotificationPrefs(channel, {
        enabled: isEnabled,
        deliveryMethods: selectedDeliveryMethods,
      });
    } catch (e) {
      setEnabled(!isEnabled);
      showError('Something went wrong. Please try again');
    }
  }

  return (
    <List.Accordion
      title={channel.name}
      description={channel.description}
      left={lprops => <List.Icon {...lprops} icon="bell" />}>
      <List.Item
        title="Allow this notification"
        left={() => <List.Icon icon="bell" />}
        right={() => (
          <Switch
            value={enabled}
            onValueChange={setNotificationEnabled}
            style={{alignSelf: 'center'}}
          />
        )}
      />
      <List.Item
        title="Push"
        left={() => <List.Icon icon="cellphone" />}
        right={() => (
          <Switch
            value={selectedDeliveryMethods.includes('PUSH')}
            style={{alignSelf: 'center'}}
            disabled={!enabled}
            onValueChange={is_enabled =>
              setDeliveryMethodEnabled('PUSH', is_enabled)
            }
          />
        )}
      />
      <List.Item
        title="Email"
        left={() => <List.Icon icon="email" />}
        right={() => (
          <Switch
            value={selectedDeliveryMethods.includes('EMAIL')}
            style={{alignSelf: 'center'}}
            disabled={!enabled}
            onValueChange={is_enabled =>
              setDeliveryMethodEnabled('EMAIL', is_enabled)
            }
          />
        )}
      />
      <List.Item
        title="SMS"
        left={() => <List.Icon icon="message" />}
        right={() => (
          <Switch
            value={selectedDeliveryMethods.includes('SMS')}
            style={{alignSelf: 'center'}}
            disabled={!enabled}
            onValueChange={is_enabled =>
              setDeliveryMethodEnabled('SMS', is_enabled)
            }
          />
        )}
      />
    </List.Accordion>
  );
};

type Props = {
  async: {
    channelPrefs: ChannelPreference[];
  };
};

export const NotificationSettingsScreen: Screen<Props> = props => {
  const pref_accordions = props.async.channelPrefs.map((channelPref, i) => {
    return (
      <NotificationAccordion
        channel={channelPref.channel}
        preference={channelPref.preference}
        key={i}
      />
    );
  });

  return (
    <View style={{backgroundColor: 'white', flex: 1}}>
      <List.Section>{pref_accordions}</List.Section>
    </View>
  );
};

NotificationSettingsScreen.title = 'Notifications';

NotificationSettingsScreen.load = async () => {
  const {getNotificationPrefs} = useNotifications();
  const channels = useNotificationChannels();
  const promises = Object.values(channels).map(async channel => {
    const preference = await getNotificationPrefs(channel);
    return {channel, preference};
  });

  return {channelPrefs: await Promise.all(promises)};
};
