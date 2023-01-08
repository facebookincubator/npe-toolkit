/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * @oncall npe_central_engineering
 */

import * as React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';

import 'hax-app-common/DataTypes';
import AllUsersScreen from './screens/AllUsersScreen';
import EditUserScreen from './screens/EditUserScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ToDeleteScreen from '@npe/lib/admin/ToDeleteScreen';
import DeletedScreen from '@npe/lib/admin/DeletedScreen';
import EditToDeleteScreen from '@npe/lib/admin/EditToDeleteScreen';
import EditDeletedScreen from '@npe/lib/admin/EditDeletedScreen';
import AllowlistScreen from '@npe/lib/admin/AllowlistScreen';
import DeletionDryrunScreen from '@npe/lib/admin/DeletionDryrunScreen';
import SendNotificationModal from './screens/SendNotificationModal';
import {NavContext, useReactNavScreens} from '@npe/lib/screen/ReactNavScreens';
import {drawerLayout} from '@npe/lib/alpha/ui/DrawerLayout';
import {useAuth} from '@npe/lib/auth/AuthService';
import BroadcastNotificationModal from './screens/BroadcastNotificationModal';
import {useLoggedInUser} from '@npe/lib/core/UserContext';
import Role from '@npe/lib/core/Role';
import {NavItem} from '@npe/lib/alpha/ui/Drawer';

const Stack = createStackNavigator();
const DrawerNavigator = () => {
  const auth = useAuth();
  const user = useLoggedInUser();
  const isDev = user?.roles?.roles.includes(Role.DEV);

  const logoutAction = {
    id: 'logout',
    label: 'Logout',
    icon: 'mci:logout',
    act: () => auth.logout(),
  };

  const navItems: NavItem[] = [
    {screen: AllUsersScreen},
    {screen: NotificationsScreen},
    {screen: AllowlistScreen},
  ];

  if (isDev) {
    navItems.push(
      {divider: true},
      {header: 'Deletion'},
      {screen: DeletedScreen},
      {screen: ToDeleteScreen},
      {screen: DeletionDryrunScreen},
    );
  }

  const routes = {
    users: AllUsersScreen,
    notifications: NotificationsScreen,
    send_notif: SendNotificationModal,
    edit_user: EditUserScreen,
    login: LoginScreen,
    broadcast: BroadcastNotificationModal,
    deleted: DeletedScreen,
    edit_deleted: EditDeletedScreen,
    todelete: ToDeleteScreen,
    edit_todelete: EditToDeleteScreen,
    deletion_dryrun: DeletionDryrunScreen,
    allowlist: AllowlistScreen,
  };
  const {navScreens, linkingScreens} = useReactNavScreens(
    routes,
    drawerLayout({
      title: 'Hax App Admin',
      navItems: navItems,
      loginScreen: LoginScreen,
      home: AllUsersScreen,
      navWidth: 300,
      navActions: [logoutAction],
    }),
    Stack.Screen,
  );

  const linking = {
    prefixes: ['localhost:19006'],
    config: linkingScreens,
  };

  return (
    <NavigationContainer linking={linking}>
      <NavContext routes={routes} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {navScreens}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default DrawerNavigator;
