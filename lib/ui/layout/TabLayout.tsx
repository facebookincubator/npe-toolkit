/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {useRoute} from '@react-navigation/core';
import {useNavigation} from '@react-navigation/native';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {canLoggingInFix} from '@toolkit/core/api/Auth';
import {eventFromCamelCase, useLogEvent} from '@toolkit/core/api/Log';
import {LayoutComponent, LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {Icon} from '@toolkit/ui/components/Icon';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import TriState from '@toolkit/core/client/TriState';
import {Opt} from '@toolkit/core/util/Types';

function LoadingView() {
  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  );
}
export type NavItem = {
  icon: string;
  title: string;
  screen: Screen<any>;
  route: string; // Temporary until all is switched to screens
};

type TabLayoutProps = {
  tabs: NavItem[];
  headerRight: NavItem[];
  loginScreen?: Screen<any>;
};

/**
 * Create a tab-based layout. Allows customizing the tabs and the items
 * on the top-right header.
 *
 * Most apps will gwant to customize this component - instead of creating
 * more options and knobs, when you want to do something not supported by
 * the default options, just make a copy `TabLayout.tsx` in your app directory
 * and customize at will!
 */
export function tabLayout(tabProps: TabLayoutProps): LayoutComponent {
  const {tabs} = tabProps;

  // Top level Tabs must use style.type = 'top to play nicely in navigation
  tabs.forEach(tab => {
    tab.screen.style = tab.screen.style || {};
    tab.screen.style.type = 'top';
  });

  return (layoutProps: LayoutProps) => (
    <TabLayout {...tabProps} {...layoutProps} />
  );
}

function eventNameFromScreen(screen: string) {
  return 'VIEW_' + eventFromCamelCase(screen.replace('Screen', ''));
}

const TabLayout = (props: LayoutProps & TabLayoutProps) => {
  const {title = '', children, style, tabs, headerRight, loginScreen} = props;
  const loadingView = props.loading ?? LoadingView;
  const reactNav = useNavigation<any>();
  const nav = useNav();
  const userMessaging = useUserMessaging();
  const isMobile = useIsMobile();
  const logEvent = useLogEvent();

  const route = useRoute();
  const key = route.key;

  React.useEffect(() => {
    // Clear user messages when navigating
    const unsubscribe = reactNav.addListener('focus', () => {
      userMessaging.clear();
      logEvent(eventNameFromScreen(route.name));
    });

    return unsubscribe;
  }, [reactNav]);

  function onError(err: Error) {
    // If you can fix the error by logging back in, redirect to login
    if (canLoggingInFix(err) && loginScreen) {
      reactNav.setOptions({animationEnabled: false});
      setTimeout(() => nav.reset(loginScreen), 0);
    }
    return false;
  }

  const navStyle = style?.nav ?? 'full';
  const navType = style?.type ?? 'std';
  const showBack = nav.backOk() && navType !== 'top';
  const showTabs = navType === 'top' && navStyle === 'full';

  if (navType === 'modal') {
    // Modal views are just the content: No SafeAreaView, Header, or Tabs
    return (
      <View style={S.top}>
        {navStyle == 'full' && <Header title={title} showBack={true} />}
        <ScrollView style={S.container} contentContainerStyle={S.modalContent}>
          <TriState key={key} onError={onError} loadingView={loadingView}>
            <View style={{flex: 1}}>{children}</View>
          </TriState>
        </ScrollView>
      </View>
    );
  }

  if (isMobile) {
    return (
      <SafeAreaView style={S.top}>
        <View style={{flex: 1, backgroundColor: '#F0F0F0'}}>
          {navStyle === 'full' && (
            <Header title={title} navItems={headerRight} showBack={showBack} />
          )}
          <View style={{flex: 1}}>
            <TriState key={key} onError={onError} loadingView={loadingView}>
              <View style={{flex: 1}}>{children}</View>
            </TriState>
          </View>
          {showTabs && <BottomTabs tabs={tabs} />}
        </View>
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={S.top}>
        <View style={{flex: 1, backgroundColor: '#F0F0F0'}}>
          {navStyle === 'full' && (
            <TopHeader
              tabs={tabs}
              title={title}
              navItems={headerRight}
              showBack={showBack}
            />
          )}
          <View style={{flex: 1}}>
            <TriState key={key} onError={onError} loadingView={loadingView}>
              <View style={{flex: 1}}>{children}</View>
            </TriState>
          </View>
        </View>
      </SafeAreaView>
    );
  }
};

type IconButtonProps = {
  name: string;
  size: number;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  title?: Opt<string>;
  onPress: () => void;
};

/**
 * Convenience wrapper for creating a Pressable icon
 */
const IconButton = (props: IconButtonProps) => {
  const {name, size, style, onPress, title, disabled} = props;

  return (
    <Pressable onPress={onPress} style={style}>
      {/** @ts-ignore */}
      <Icon name={name} size={size} />
      {title && <Text>{title}</Text>}
    </Pressable>
  );
};

type HeaderProps = {
  title: string;
  navItems?: NavItem[];
  showBack: boolean;
};

const Header = ({title, navItems = [], showBack}: HeaderProps) => {
  const {location} = useNavState();
  const {navTo, back} = useNav();

  function visible(item: NavItem) {
    return item.route !== location.route;
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
            name={item.icon}
            size={28}
            style={S.headerRight}
            onPress={() => navTo(item.screen)}
            key={idx}
          />
        ))}
      </View>
      <View style={S.titleBox}>
        <Text style={S.title}>{' ' + title + ' '}</Text>
      </View>
    </View>
  );
};

type TabBarProps = {
  tabs: NavItem[];
};

const BottomTabs = ({tabs}: TabBarProps) => {
  const route = useRoute();
  const nav = useNav();

  function enabled(item: NavItem) {
    return item.route !== route.name;
  }

  function styleFor(tab: NavItem) {
    return [S.bottomTab, {opacity: enabled(tab) ? 0.5 : 1}];
  }

  return (
    <View style={S.tabs}>
      {tabs.map((tab, idx) => (
        <View style={styleFor(tab)} key={idx}>
          <IconButton
            name={tab.icon}
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

const TopHeader = (props: TabBarProps & HeaderProps) => {
  const {tabs, title, navItems, showBack} = props;
  const route = useRoute();
  const {location} = useNavState();
  const nav = useNav();

  function enabled(item: NavItem) {
    return item.route !== route.name;
  }

  function styleFor(tab: NavItem) {
    const bottomWidthStyle = enabled(tab) ? {} : {borderBottomWidth: 3};
    return [S.topTab, bottomWidthStyle];
  }

  function visible(item: NavItem) {
    return item.route !== location.route;
  }

  const rights = navItems?.filter(item => visible(item)) || [];
  const iconCount = Math.max(tabs.length, rights.length);
  const actionsStyle = [S.topNavActions, {flexBasis: iconCount * 60}];

  return (
    <View style={{backgroundColor: '#FFF'}}>
      <View style={S.topTabs}>
        <View style={actionsStyle}>
          {tabs.map((tab, idx) => (
            <View style={styleFor(tab)} key={idx}>
              <IconButton
                name={tab.icon}
                disabled={!enabled(tab)}
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
              name={item.icon}
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

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
}

function useIsMobile() {
  return Platform.OS !== 'web' || getDeviceType() === 'mobile';
}

const S = StyleSheet.create({
  top: {flex: 1, alignSelf: 'stretch', backgroundColor: '#FFF'},
  container: {flex: 1, padding: 0, height: '100%'},
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
  bottomTab: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 2,
    alignItems: 'center',
  },
  topTab: {
    height: 50,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'green',
  },
  headerRight: {opacity: 0.65, marginRight: 8},
  modalContent: {flex: 1, marginBottom: 30},
});

export default TabLayout;
