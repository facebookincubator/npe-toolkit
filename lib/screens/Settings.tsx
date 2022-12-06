/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {MaterialCommunityIcons as Icon} from '@expo/vector-icons';
import {Action, useAction} from '@toolkit/core/client/Action';
import {Screen} from '@toolkit/ui/screen/Screen';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export type Setting = Action | string;

// TODO: Consider putting settings in AppContext so parts of app can contribute
type Props = {
  settings: Setting[];
};

const NPESettings: Screen<Props> = ({settings}) => {
  return (
    <View>
      {settings.map((setting, idx) => {
        if (typeof setting === 'string') {
          return <SectionTitle key={idx} title={setting} />;
        } else {
          return <SettingsItem key={idx} action={setting} />;
        }
      })}
    </View>
  );
};

// TODO: Is this the best approach?
NPESettings.title = 'Settings';

type SettingsItemProps = {action: Action};

const SettingsItem = (props: SettingsItemProps) => {
  const action = useAction(props.action);

  // TODO: Add item info (leaving in for reference)
  const info = null;

  return (
    <TouchableOpacity style={S.itemRow} onPress={() => action.act()}>
      {action.icon != null && (
        <Icon /* @ts-ignore */
          name={action.icon}
          size={28}
          style={{opacity: 0.65, marginRight: 16, width: 28}}
        />
      )}
      <Text style={S.itemTitle}>{action.label}</Text>
      {info && <Text style={S.itemInfo}>{info}</Text>}
      <View style={{flex: 1}} />
      <Icon name="chevron-right" size={24} style={{opacity: 0.5}} />
    </TouchableOpacity>
  );
};

type SectionTitleProps = {title: string};
const SectionTitle = ({title}: SectionTitleProps) => {
  return <Text style={S.sectionTitle}>{title}</Text>;
};

const S = StyleSheet.create({
  itemRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  itemTitle: {
    fontSize: 18,
  },
  itemInfo: {
    fontSize: 12,
    paddingLeft: 16,
    opacity: 0.5,
    textAlignVertical: 'bottom',
    lineHeight: 22,
    height: 18,
  },
  sectionTitle: {
    opacity: 0.7,
    marginTop: 32,
    marginBottom: 8,
  },
});

export default NPESettings;
