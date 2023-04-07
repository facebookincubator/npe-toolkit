/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Appbar,
  Divider,
  FAB,
  IconButton,
  Menu,
  Subheading,
  Text,
  useTheme,
} from 'react-native-paper';
import {canLoggingInFix} from '@toolkit/core/api/Auth';
import {Action, useAction} from '@toolkit/core/client/Action';
import TriState from '@toolkit/core/client/TriState';
import {useUserMessaging} from '@toolkit/core/client/UserMessaging';
import {routeKey} from '@toolkit/providers/navigation/ReactNavigation';
import Modal from '@toolkit/ui/components/ModalDialog';
import {LayoutComponent, LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav, useNavState} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

type NavItemProps = Readonly<{
  title: string;
  items: NavItem[];
  show: boolean;
  dismiss: () => void;
  width?: number;
  over?: boolean;
}>;

export type NavItem = {
  screen?: Screen<any>;
  divider?: boolean;
  header?: string;
};

const ANIMATION = {
  tension: 250,
  friction: 100,
  useNativeDriver: false,
};

function anim(to: number) {
  return {...ANIMATION, toValue: to};
}

function NavItems(props: NavItemProps) {
  const {title, items, show, dismiss, width = 200, over = false} = props;
  const [visible, setVisible] = React.useState(false);
  const toWidth = React.useRef(new Animated.Value(0));
  const {location, routes} = useNavState();
  const nav = useNav();
  const theme = useTheme();

  if (show !== visible) {
    const to = show ? width + 1 : 0; // Extra width for border to be offscreen
    Animated.spring(toWidth.current, anim(to)).start(() => setVisible(show));
  }

  function onItem(item: NavItem) {
    if (over) {
      dismiss();
    }
    if (item.screen) {
      nav.navTo(item.screen);
    }
  }

  const navStyle = [
    S.navbar,
    over && S.over,
    {
      maxWidth: toWidth.current,
      width: toWidth.current,
      backgroundColor: '#F8F8FC',
      borderRightWidth: 1,
      borderColor: '#E8E8E8',
      overflow: 'hidden',
      left: -1,
    },
  ];

  function navStyleFor(item: NavItem): TextStyle {
    return location.route === routeKey(item.screen, routes)
      ? {fontWeight: '700'}
      : {};
  }

  function navItemFor(item: NavItem, idx: number) {
    if (item.screen) {
      const label = item.screen?.title;
      return (
        <TouchableOpacity key={idx} onPress={() => onItem(item)}>
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 20,
              borderRadius: 12,
              width: 250,
            }}>
            {/* @ts-ignore */}
            <Text style={[{fontSize: 16}, navStyleFor(item)]}>{label}</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.header) {
      return (
        <Subheading
          key={idx}
          style={{
            fontSize: 14,
            paddingHorizontal: 10,
            paddingVertical: 10,
          }}>
          {item.header}
        </Subheading>
      );
    } else {
      return (
        <Divider key={idx} style={{backgroundColor: theme.colors.disabled}} />
      );
    }
  }

  return (
    // @ts-ignore
    <Animated.View style={navStyle}>
      <View>{items.map((item, idx) => navItemFor(item, idx))}</View>
    </Animated.View>
  );
}

function Drawer(props: NavItemProps) {
  const {show, dismiss, over = false} = props;

  return (
    <>
      <NavItems {...props} />
      {show && over && (
        <TouchableWithoutFeedback onPress={dismiss}>
          {over && <View style={S.wash} />}
        </TouchableWithoutFeedback>
      )}
    </>
  );
}

type DrawerProps = {
  title: string;
  navItems: NavItem[];
  navWidth?: number;
  loadingView?: React.ComponentType<any>;
  loginScreen?: Screen<any>;
  home?: Screen<any>;
  navActions?: Action[];
};
type DrawerLayoutProps = LayoutProps & DrawerProps;

function setPageTitle(title: string) {
  if (Platform.OS === 'web') {
    document.title = title;
  }
}

export function drawerLayout(layoutProps: DrawerProps): LayoutComponent {
  const layout: LayoutComponent = props => (
    <DrawerLayout {...layoutProps} {...props} />
  );
  return layout;
}

const GO_BACK = () => {
  const nav = useNav();

  return {
    id: 'GO_BACK',
    label: 'go back',
    icon: 'chevron-left',
    act: () => nav.back(),
  };
};

function AppBarAction(props: {action: Action; color: string}) {
  const {action, color} = props;
  const {icon, act} = useAction(action);

  if (icon == null) {
    return <></>;
  }
  return <Appbar.Action icon={icon} color={color} onPress={() => act()} />;
}

const DrawerLayout = (props: DrawerLayoutProps) => {
  const {mainAction, actions = [], children, style} = props;
  const {
    title,
    navItems,
    navWidth,
    navActions = [],
    loadingView,
    loginScreen,
    home,
  } = props;
  const nav = useNav();
  const navOver = Dimensions.get('window').width < 800;
  const [showNav, setShowNav] = React.useState(false);
  const reactNav = useNavigation<any>();
  const {routes, location} = useNavState();
  const route = useRoute();
  const userMessaging = useUserMessaging();
  const rnPaperTheme = useTheme();

  function onError(err: Error) {
    if (canLoggingInFix(err) && loginScreen) {
      reactNav.setOptions({animationEnabled: false});
      setTimeout(() => nav.reset(loginScreen), 0);
    }
    return false;
  }

  React.useEffect(() => {
    // Clear user messages when navigating
    const unsubscribe = reactNav.addListener('beforeRemove', () => {
      userMessaging.clear();
    });

    return unsubscribe;
  }, [reactNav]);

  const titleEl = (
    <Text style={{fontSize: 18, fontWeight: 'bold'}}>{title}</Text>
  );

  const appbarTextColor = '#FFF';

  function hideNav() {
    setShowNav(false);
  }

  function toggle() {
    setShowNav(!showNav);
  }

  let curPageInNav = false;
  for (const item of navItems) {
    if (routeKey(item.screen, routes) === location.route) {
      curPageInNav = true;
    }
  }

  const showBackNav = nav.backOk() && !curPageInNav;
  const showNavToggle = !showBackNav && (!navOver || curPageInNav);
  const includeNavBar = style?.nav !== 'none' && style?.type !== 'modal';
  const showNavHere = showNav && showNavToggle;
  const navActionButtons = navActions.map((action, i) => (
    <AppBarAction key={i} action={action} color={appbarTextColor} />
  ));

  // Show actions in a menu if there's more than 1. Otherwise, just show the icon in the action bar
  let screenActions =
    actions.length === 1 ? (
      <AppBarAction action={actions[0]} color={appbarTextColor} />
    ) : (
      <ActionMenu actions={actions} color={appbarTextColor} />
    );

  if (title != null) {
    setPageTitle(title);
  }

  if (style?.type === 'modal') {
    return (
      <Modal>
        <TriState
          key={route.key}
          onError={onError}
          loadingView={() => (
            <View style={S.modalLoading}>
              <Text>Loading...</Text>
            </View>
          )}>
          {children}
        </TriState>
      </Modal>
    );
  }

  return (
    <View style={{flex: 1}}>
      {style?.nav !== 'none' && (
        <Appbar.Header style={{zIndex: 5}} dark={true}>
          {showNavToggle && <Appbar.Action icon="menu" onPress={toggle} />}
          {showBackNav && (
            <AppBarAction action={GO_BACK} color={appbarTextColor} />
          )}
          {home && includeNavBar && (
            <Appbar.Action icon="home" onPress={() => nav.navTo(home)} />
          )}
          {includeNavBar && navActionButtons}
          <Appbar.Content title={titleEl} />
          {actions.length > 0 && screenActions}
        </Appbar.Header>
      )}
      <View style={{flex: 1, flexDirection: 'row'}}>
        {includeNavBar && (
          <Drawer
            title={title}
            show={showNavHere}
            items={navItems}
            dismiss={hideNav}
            width={navWidth}
            over={navOver}
          />
        )}
        <ScrollView style={S.container} contentContainerStyle={{flex: 1}}>
          <TriState key={route.key} onError={onError} loadingView={loadingView}>
            <View style={{flex: 1}}>{children}</View>
          </TriState>
        </ScrollView>
      </View>
      <View style={S.bottomItems}>
        <View style={{flexGrow: 1}} />
        {mainAction && <ActionFAB action={mainAction} />}
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  container: {flex: 1},
  bottomItems: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    zIndex: 1,
    flexDirection: 'row',
  },
  modalLoading: {
    backgroundColor: 'white',
    width: 100,
    height: 50,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 20,
  },
  navbar: {
    left: 0,
    marginLeft: 0,
    zIndex: 2,
    bottom: 0,
    top: 0,
  },
  over: {
    position: 'absolute',
  },
  row: {
    padding: 8,
    marginTop: 12,
    marginBottom: 0,
  },
  wash: {
    opacity: 0.3,
    backgroundColor: '#000',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});

export default DrawerLayout;

type WithoutIcon = Omit<React.ComponentProps<typeof FAB>, 'icon'>;
type ActionFABProps = WithoutIcon & {action: Action; icon?: string};

function ActionFAB(props: ActionFABProps) {
  const {action, icon, ...fabProps} = props;

  const actionSpec = useAction(action);
  const iconSpec = actionSpec.icon || icon;

  if (!iconSpec) {
    throw Error('Must provide icon to FAB via Action or icon prop');
  }

  return <FAB {...fabProps} icon={iconSpec} onPress={() => actionSpec.act()} />;
}

type ActionMenuProps = {
  actions: Action[];
  size?: number;
  color: string;
};

const ActionMenu = (props: ActionMenuProps) => {
  const {size = 18, color} = props;
  const actions = props.actions.map(action => useAction(action));
  const [menuVisible, setMenuVisible] = React.useState(false);

  const show = () => setMenuVisible(true);
  const hide = () => setMenuVisible(false);

  function menuItemSelected(index: number): void {
    actions[index].act();
    setMenuVisible(false);
  }

  const anchor = (
    <IconButton onPress={show} icon="dots-vertical" size={size} color={color} />
  );

  return (
    <Menu
      visible={menuVisible}
      onDismiss={hide}
      style={styles.menu}
      contentStyle={styles.menuContent}
      anchor={anchor}>
      {actions.map((action, index) => (
        <Menu.Item
          key={action.id}
          onPress={() => menuItemSelected(index)}
          style={styles.menuItem}
          icon={action.icon}
          title={action.label}
        />
      ))}
    </Menu>
  );
};

const styles = StyleSheet.create({
  menu: {
    marginTop: 40,
  },
  menuContent: {
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    paddingHorizontal: 0,
  },
  menuItem: {
    borderBottomWidth: 1,
    height: 48,
    borderColor: '#F0F0F0',
  },
});
