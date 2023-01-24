/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';

import AllUsersScreen from './screens/AllUsersScreen';
import EditUserScreen from './screens/EditUserScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ToDeleteScreen from '@toolkit/experimental/deletion/screens/Deletion';
import DeletedScreen from '@toolkit/experimental/deletion/screens/Deleted';
import EditToDeleteScreen from '@toolkit/experimental/deletion/screens/EditToDelete';
import EditDeletedScreen from '@toolkit/experimental/deletion/screens/EditDeleted';
import AllowlistScreen from '@toolkit/screens/admin/Allowlist';
import DeletionDryrunScreen from '@toolkit/experimental/deletion/screens/DeletionDryRun';
import SendNotificationModal from './screens/SendNotificationModal';
import {
  NavContext,
  useReactNavScreens,
} from '@toolkit/providers/navigation/ReactNavigation';
import {drawerLayout, NavItem} from '@toolkit/ui/layout/DrawerLayout';
import {useAuth} from '@toolkit/core/api/Auth';
import BroadcastNotificationModal from './screens/BroadcastNotificationModal';
import {useLoggedInUser} from '@toolkit/core/api/User';
import Role from '@toolkit/core/api/Roles';

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
