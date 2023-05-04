/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Simple layout building blocks that can be used to build a solid initial layout.
 * You will often graduate out of using these as your app gets more complex.
 */

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
import {useRoute} from '@react-navigation/core';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLoggedInUser} from '@toolkit/core/api/User';
import TriState from '@toolkit/core/client/TriState';
import {Opt} from '@toolkit/core/util/Types';
import {Icon} from '@toolkit/ui/components/Icon';
import {LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

/**
 * Common loading view that shows a centered React Native `<ActivityIndicator>`.
 * You'll still want to render common nav items (e.g. header, bottom tabs, etc) and
 * center this in the main content area
 * @returns
 */
export function LoadingView() {
  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * Information needed to render a simple naivgation entry.
 * For more complex navigation structures, branch this to make your own
 */
export type NavItem = {
  /* The screen to navigate to. By default title will be pulled from the screen */
  screen: Screen<any>;
  /* Icon for the NavItem. Required for many layouts */
  icon?: string;
  /* Title override in case title in navigation is not equal to the screen title */
  title?: string;
};

export type NavItems = {
  /* The main app navigatio entries */
  main: NavItem[];
  /* Extra navigtaion entries, usually rendered in the top right */
  extra: NavItem[];
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
export const IconButton = (props: IconButtonProps) => {
  const {name, size, style, onPress, title, disabled} = props;

  return (
    <Pressable onPress={onPress} style={style}>
      {/** @ts-ignore */}
      <Icon name={name} size={size} />
      {title && <Text>{title}</Text>}
    </Pressable>
  );
};

/**
 * Gets an icon with a default, useful for optional icons
 */
export function getIcon(item: NavItem) {
  return item.icon ?? 'mci:file-question-outline';
}

export function logError(err: Error) {
  console.error(err);
  return false;
}

export const ModalLayout = (props: LayoutProps) => {
  const {title = '', children, style} = props;
  const loadingView = props.loading ?? LoadingView;
  const onError = props.onError ?? logError;
  const route = useRoute();
  const {back} = useNav();

  const key = route.key;

  const navStyle = style?.nav ?? 'full';
  const Container = Platform.OS === 'android' ? SafeAreaView : View;

  return (
    <Container style={S.top}>
      {navStyle == 'full' && (
        <View style={S.header}>
          <View style={S.backContainer}>
            <Pressable onPress={back}>
              <Text style={S.done}>Done</Text>
            </Pressable>
          </View>
          <View style={S.titleBox}>
            <Text style={S.title}>{' ' + title + ' '}</Text>
          </View>
        </View>
      )}
      <ScrollView style={S.container} contentContainerStyle={S.modalContent}>
        <TriState key={key} onError={onError} loadingView={loadingView}>
          <View style={{flex: 1}}>{children}</View>
        </TriState>
      </ScrollView>
    </Container>
  );
};

/**
 * Utility to only render contents after app has loaded.
 *
 * Currently this only ensures that initial user value is set (can be null) but
 * has already checked if the user has logged in.
 *
 * Need to call inside `<TriState>` or other `<React.Suspense>` boundary.
 */
export const WaitForAppLoad = (props: {children: React.ReactNode}) => {
  // Throws a `<React.Suspense>` promise if user isn't loaded
  useLoggedInUser();

  return <>{props.children}</>;
};

const S = StyleSheet.create({
  top: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    padding: 0,
    height: '100%',
  },
  modalContent: {
    flex: 1,
    marginBottom: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
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

  backContainer: {
    flexDirection: 'row',
    zIndex: 2,
    position: 'absolute',
    left: 20,
    height: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  done: {
    fontSize: 18,
    color: '#444',
  },
});
