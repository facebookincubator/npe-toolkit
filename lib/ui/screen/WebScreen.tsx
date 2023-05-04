/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Linking, Platform, View} from 'react-native';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import {ActionItem, actionHook} from '@toolkit/core/client/Action';
import {CodedError} from '@toolkit/core/util/CodedError';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';

type Props = {
  url: string;
};

/**
 * Utility to open a URL. Will use in-app browser on native, and
 * IFRAME on web if `iframeOnWeb` is set, otherwise will open in new window.
 *
 * URLd have to be allowlisted. List is currently in this file but
 * will turn into a runtime config per application.
 *
 * Usage:
 * ```
 * function MyComponent() {
 *   const openUrl = useOpenUrl();
 *
 *   function onPress() {
 *     openUrl('https://www.somesite.com/', true);
 *   }
 *
 *   return <Button onPress={onPress}/>
 * }
 * ```
 */
export function useOpenUrl() {
  const {navTo} = useNav();

  return (url: string, iframeOnWeb: boolean = false) => {
    if (Platform.OS === 'web' && !iframeOnWeb) {
      // TODO: Consider adding options for opening
      Linking.openURL(url);
    } else {
      navTo(WebScreen, {url});
    }
  };
}

export type OpenLinkAction = {
  id: string;
  label: string;
  url: string;
  icon?: string;
};

export function openUrlAction(spec: OpenLinkAction): ActionItem {
  const {id, label, url, icon} = spec;

  return {
    id: `LINK_TO_${id}`,
    label,
    icon,
    action: actionHook(() => {
      const openUrl = useOpenUrl();
      return () => {
        openUrl(url);
      };
    }),
  };
}

/**
 * Screen params may be settable by an attacker via deep link, and
 * we shouldn't open arbitrary URLs.
 *
 * This is a quick hack to limit usage - we need a list that is configurable per app.
 */
let allowedUrlPrefixes: string[] = [];

export function allowWebScreenDomains(urls: string[]) {
  console.log('allowWebScreenDomains', urls);
  for (const url of urls) {
    // Get the scheme and host
    const match = url.match(/^(https?:\/\/[^\/]+)\//);
    console.log(match, url);
    if (match) {
      allowedUrlPrefixes.push(match[0]);
    }
  }
}

function checkOkToLoad(url: string) {
  for (const prefix of allowedUrlPrefixes) {
    if (url.indexOf(prefix) === 0) {
      return;
    }
  }
  throw new CodedError('webview.invalid_url', "This page can't be viewed.");
}

/**
 * Render a web page in a modal view.
 *
 * TODO: Error handling
 * TODO: Nav bar doesn't look great, need UX guidance
 * TODO: Better security checks
 */
const WebScreen: Screen<Props> = props => {
  const {url} = props;
  const {back} = useNav();
  const closed = React.useRef(false);

  checkOkToLoad(url);

  function close() {
    if (!closed.current) {
      closed.current = true;
      back();
    }
  }

  // Close web view if web view posts a "CLOSE" message to us
  function checkCloseMessage(event: WebViewMessageEvent) {
    if (event.nativeEvent.data === 'CLOSE') {
      close();
    }
  }

  // Close web view if we redirect to a page which is a signal to close
  // Using 'https://npe-survey.web.app' as a temporary option
  function checkCloseUrl(state: WebViewNavigation) {
    if (state.url.indexOf('https://npe-survey.web.app') === 0) {
      close();
    }
  }

  return (
    <View style={{flex: 1}}>
      <WebView
        source={{uri: url}}
        onNavigationStateChange={checkCloseUrl}
        onMessage={checkCloseMessage}
      />
    </View>
  );
};

WebScreen.title = '';
WebScreen.style = {type: 'modal'};

export default WebScreen;
