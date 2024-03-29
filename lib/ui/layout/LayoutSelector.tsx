/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {useRoute} from '@react-navigation/core';
import {useNavigation} from '@react-navigation/native';
import {canLoggingInFix} from '@toolkit/core/api/Auth';
import {useLogEvent} from '@toolkit/core/api/Log';
import {useUserMessaging} from '@toolkit/core/client/Status';
import {deviceIsMobile} from '@toolkit/core/util/Environment';
import {LayoutComponent, LayoutProps} from '@toolkit/ui/screen/Layout';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

type Layouts = {
  base: LayoutComponent;
  mobile?: LayoutComponent;
  desktopWeb?: LayoutComponent;
  modal?: LayoutComponent;
  loginScreen?: Screen<any>;
};

export function layoutSelector(layouts: Layouts) {
  return (layoutProps: LayoutProps) => (
    <LayoutSelector {...layouts} {...layoutProps} />
  );
}

const LayoutSelector = (props: Layouts & LayoutProps) => {
  const {style, loginScreen, base, mobile, modal, desktopWeb} = props;
  const reactNav = useNavigation<any>();
  const nav = useNav();
  const userMessaging = useUserMessaging();
  const isMobile = deviceIsMobile();
  const logEvent = useLogEvent();

  React.useEffect(() => {
    // Clear user messages when navigating
    const unsubscribe = reactNav.addListener('focus', () => {
      userMessaging.clear();
      logEvent('View');
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

  let Layout;

  if (style?.type === 'modal') {
    Layout = modal ?? base;
  } else if (isMobile) {
    Layout = mobile ?? base;
  } else {
    Layout = desktopWeb ?? base;
  }

  return <Layout {...props} onError={onError} />;
};
