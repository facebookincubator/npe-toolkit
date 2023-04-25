/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useRoute} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';
import TriState from '@toolkit/core/client/TriState';
import {StatusContainer} from '@toolkit/core/client/UserMessaging';
import {routeKey} from '@toolkit/providers/navigation/ReactNavigation';
import {
  IconButton,
  LoadingView,
  NavItem,
  NavItems,
  WaitForAppLoad,
  getIcon,
  logError,
} from '@toolkit/ui/layout/LayoutBlocks';
import {LayoutComponent, LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';

/**
 * Create a tab-based layout where main nav is on the top left of the top bar
 */
export function topbarLayout(navItems: NavItems): LayoutComponent {
  const {main: tabs} = navItems;

  // Top level Tabs must use style.type = 'top to play nicely in navigation
  tabs.forEach(tab => {
    tab.screen.style = tab.screen.style || {};
    tab.screen.style.type = 'top';
  });

  return (layoutProps: LayoutProps) => (
    <TopbarLayout {...navItems} {...layoutProps} />
  );
}
const TopbarLayout = (props: LayoutProps & NavItems) => {
  const {children, style} = props;
  const loadingView = props.loading ?? LoadingView;
  const onError = props.onError ?? logError;

  const route = useRoute();
  const key = route.key;

  const navStyle = style?.nav ?? 'full';

  return (
    <StatusContainer>
      <SafeAreaView style={S.top}>
        <View style={{flex: 1, backgroundColor: '#F0F0F0'}}>
          {navStyle === 'full' && <TopHeader {...props} />}
          <View style={{flex: 1}}>
            <TriState key={key} onError={onError} loadingView={loadingView}>
              <WaitForAppLoad>
                <View style={{flex: 1}}>{children}</View>
              </WaitForAppLoad>
            </TriState>
          </View>
        </View>
      </SafeAreaView>
    </StatusContainer>
  );
};

const TopHeader = (props: LayoutProps & NavItems) => {
  const {main: tabs, extra, title} = props;
  const {location, routes} = useNavState();
  const nav = useNav();

  function styleFor(tab: NavItem) {
    const bottomWidthStyle = isCurrent(tab) ? {borderBottomWidth: 3} : {};
    return [S.topTab, bottomWidthStyle];
  }

  function isCurrent(item: NavItem) {
    return routeKey(item.screen, routes) === location.route;
  }

  const rights = extra?.filter(item => !isCurrent(item)) || [];
  const iconCount = Math.max(tabs.length, rights.length);
  const actionsStyle = [S.topNavActions, {flexBasis: iconCount * 60}];

  return (
    <View style={{backgroundColor: '#FFF'}}>
      <View style={S.topTabs}>
        <View style={actionsStyle}>
          {tabs.map((tab, idx) => (
            <View style={styleFor(tab)} key={idx}>
              <IconButton
                name={getIcon(tab)}
                disabled={isCurrent(tab)}
                size={28}
                onPress={() => nav.reset(tab.screen)}
                style={{alignItems: 'center', justifyContent: 'center'}}
              />
            </View>
          ))}
        </View>

        <Text style={[S.title]}>{title}</Text>
        <View style={[actionsStyle, {justifyContent: 'flex-end'}]}>
          {rights.map((item, idx) => (
            <IconButton
              name={getIcon(item)}
              size={28}
              style={S.topTab}
              onPress={() => nav.navTo(item.screen)}
              key={idx}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  top: {flex: 1, alignSelf: 'stretch', backgroundColor: '#FFF'},
  title: {
    fontSize: 26,
    fontWeight: '600',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  topTab: {
    height: 50,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'green',
  },
});
