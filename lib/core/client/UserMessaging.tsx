/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import * as React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Handler} from '@toolkit/core/client/Action';
import {toUserMessage} from '@toolkit/core/util/CodedError';
import {
  contextKey,
  setInitialAppContext,
  useAppContext,
} from '@toolkit/core/util/AppContext';
import {toError} from '@toolkit/core/util/Types';

/**
 * API to display messages to a user that can be called from any layer of the stack.
 * These are often displayed as transient overlays but this is not a required.
 *
 * To use, an app must add a component near the top of their component tree
 * for the rendering UI that implements this API and registers - example
 * is here, but there will be xxx
 */
type UserMessagingApi = {
  showError: (error: Error | string) => void;
  showMessage: (text: string) => void;
  clear: () => void;
};

const USER_MESSAGING_KEY = contextKey<UserMessagingApi>('NPE.UserMessaging');

export function useUserMessaging(): UserMessagingApi {
  return useAppContext(USER_MESSAGING_KEY);
}

/**
 * Simple, non-configurable example of user messaging that
 * doesn't rely on any UI libraries.
 *
 * Useful to get started but you should either:
 * (a) copy and modify, or
 * (b) use one of the awesome higher level libraries we're going
 * to create
 *
 * When you move to production.
 */
// TODO: Hook into navigation and clear when navigating
export const SimpleUserMessaging = (props: {style?: ViewStyle}) => {
  const {style} = props;
  const [visible, setVisible] = React.useState(false);
  const [msg, setMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const timeout = React.useRef<any>();
  const CLEAR_DELAY = 5000;

  function clearAfterDelay() {
    // Remove existing clear timer
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      timeout.current = null;
      clear();
    }, CLEAR_DELAY);
  }

  function showError(error: Error | string) {
    const text = typeof error === 'string' ? error : toUserMessage(error);
    setMessage(text);
    setIsError(true);
    setVisible(true);
    clearAfterDelay();
  }

  function showMessage(text: string) {
    setMessage(text);
    setIsError(false);
    setVisible(true);
    clearAfterDelay();
  }

  function clear() {
    setMessage('');
    setVisible(false);
  }

  const api = {showError, showMessage, clear};

  setInitialAppContext(USER_MESSAGING_KEY, api);

  const colorStyle = isError
    ? {backgroundColor: '#FFD2D2', borderColor: '#FFD2D2'}
    : {backgroundColor: '#BDE5F8', borderColor: '#BDE5F8'};

  return (
    <>
      {visible && (
        <View style={[S.bottomOverlay, colorStyle, style]}>
          <Text style={S.text}>{msg}</Text>
        </View>
      )}
    </>
  );
};

const S = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 100,
    zIndex: 4,
    borderWidth: 16,
    borderRadius: 16,
  },
  text: {textAlign: 'center', fontSize: 16},
});

/**
 * Display an error message if the handler fails.
 * If success is passed in, display this message when succeeding.
 */
export function withUserMessage(handler: Handler, success?: string) {
  const {showMessage, showError} = useUserMessaging();

  return async () => {
    try {
      await handler();
      if (success) {
        showMessage(success);
      }
    } catch (e) {
      showError(toError(e));
    }
  };
}

type Promiser<T> = () => Promise<T>;

/**
 * Wrap a method that returns a promise to show a user message if it fails.
 */
export function useMessageOnFail() {
  const {showError} = useUserMessaging();

  return function msgOnFail<T>(wrapped: Promiser<T>): Promiser<T> {
    return () => {
      const result = wrapped();
      return result.catch(e => {
        showError(toError(e));
        throw e;
      });
    };
  };
}
