/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ActionItem, useAction} from '@toolkit/core/client/Action';
import {Icon} from '@toolkit/ui/components/Icon';
import {Screen} from '@toolkit/ui/screen/Screen';

export type Setting = ActionItem | string;

// TODO: Consider putting settings in AppContext so parts of app can contribute
type Props = {
  settings: Setting[];
};

const Settings: Screen<Props> = ({settings}) => {
  return (
    <View>
      {settings.map((setting, idx) => {
        if (typeof setting === 'string') {
          return <SectionTitle key={idx} title={setting} />;
        } else {
          return <SettingsItem key={idx} item={setting} />;
        }
      })}
    </View>
  );
};

// TODO: Is this the best approach?
Settings.title = 'Settings';

type SettingsItemProps = {item: ActionItem};

const SettingsItem = (props: SettingsItemProps) => {
  const {item} = props;
  const [handler] = useAction(item.id, item.action);

  // TODO: Add item info (leaving in for reference)
  const info = null;

  return (
    <TouchableOpacity style={S.itemRow} onPress={handler}>
      {item.icon != null && (
        <View style={S.iconBox}>
          <Icon name={item.icon} size={28} style={{opacity: 0.65, width: 28}} />
        </View>
      )}
      <Text style={S.itemTitle}>{item.label}</Text>
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
  iconBox: {
    width: 28,
    height: 28,
    marginRight: 16,
  },
});

export default Settings;
