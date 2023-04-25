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
 * Create a tab-based layout. Allows customizing the tabs and the items
 * on the top-right header.
 *
 * Most apps will gwant to customize this component - instead of creating
 * more options and knobs, when you want to do something not supported by
 * the default options, just make a copy `TabLayout.tsx` in your app directory
 * and customize at will!
 */
export function bottomTabLayout(tabProps: NavItems): LayoutComponent {
  const {main: tabs} = tabProps;

  // Top level Tabs must use style.type = 'top to play nicely in navigation
  tabs.forEach(tab => {
    tab.screen.style = tab.screen.style || {};
    tab.screen.style.type = 'top';
  });

  return (layoutProps: LayoutProps) => (
    <TabLayout {...tabProps} {...layoutProps} />
  );
}

const TabLayout = (props: LayoutProps & NavItems) => {
  const {title = '', children, style, main: tabs, extra: headerRight} = props;
  const loadingView = props.loading ?? LoadingView;
  const onError = props.onError ?? logError;
  const nav = useNav();

  const route = useRoute();
  const key = route.key;

  const navStyle = style?.nav ?? 'full';
  const navType = style?.type ?? 'std';
  const showBack = nav.backOk() && navType !== 'top';
  const showTabs = navType === 'top' && navStyle === 'full';

  return (
    <SafeAreaView style={S.top}>
      <View style={S.innerTop}>
        {navStyle === 'full' && (
          <Header title={title} navItems={headerRight} showBack={showBack} />
        )}
        <View style={S.content}>
          <TriState key={key} onError={onError} loadingView={loadingView}>
            <WaitForAppLoad>
              <View style={{flex: 1}}>{children}</View>
            </WaitForAppLoad>
          </TriState>
        </View>
        {showTabs && <BottomTabs tabs={tabs} />}
      </View>
    </SafeAreaView>
  );
};

type HeaderProps = {
  title: string;
  navItems?: NavItem[];
  showBack: boolean;
};

const Header = ({title, navItems = [], showBack}: HeaderProps) => {
  const {location, routes} = useNavState();
  const {navTo, back} = useNav();

  function visible(item: NavItem) {
    return routeKey(item.screen, routes) !== location.route;
  }

  const navs = navItems.filter(item => visible(item));

  return (
    <View style={S.header}>
      <View style={S.headerActions}>
        {showBack && (
          <IconButton
            name="ion:chevron-back-outline"
            size={28}
            onPress={back}
          />
        )}
        <View style={{flexGrow: 1}} />
        {navs.map((item, idx) => (
          <IconButton
            name={getIcon(item)}
            size={28}
            style={S.headerRight}
            onPress={() => navTo(item.screen)}
            key={idx}
          />
        ))}
      </View>
      <View style={S.titleBox}>
        <Text style={S.title} numberOfLines={1}>
          {' ' + title + ' '}
        </Text>
      </View>
    </View>
  );
};

type TabBarProps = {
  tabs: NavItem[];
};

const BottomTabs = ({tabs}: TabBarProps) => {
  const nav = useNav();
  const {routes, location} = useNavState();

  function enabled(item: NavItem) {
    return routeKey(item.screen, routes) !== location.route;
  }

  function styleFor(tab: NavItem) {
    return [S.bottomTab, {opacity: enabled(tab) ? 0.5 : 1}];
  }

  return (
    <View style={S.tabs}>
      {tabs.map((tab, idx) => (
        <View style={styleFor(tab)} key={idx}>
          <IconButton
            name={getIcon(tab)}
            disabled={!enabled(tab)}
            size={28}
            title={tab.title}
            onPress={() => nav.reset(tab.screen)}
            style={{alignItems: 'center'}}
          />
        </View>
      ))}
    </View>
  );
};

const S = StyleSheet.create({
  top: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#FFF',
  },
  innerTop: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 400,
  },
  header: {
    backgroundColor: '#FFF',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
    position: 'absolute',
    left: 12,
    right: 12,
    top: 14,
  },
  titleBox: {
    alignItems: 'center',
    marginHorizontal: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  tabs: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomTab: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 2,
    alignItems: 'center',
  },
  headerRight: {opacity: 0.65, marginRight: 8},
});

export default TabLayout;
