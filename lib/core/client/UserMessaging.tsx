/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Handler} from '@toolkit/core/client/Action';
import {contextKey, setInitialAppContext} from '@toolkit/core/util/AppContext';
import {CodedError, toUserMessage} from '@toolkit/core/util/CodedError';
import {Opt, toError} from '@toolkit/core/util/Types';
import {useComponents} from '@toolkit/ui/components/Components';

/**
 * API to to coordinate an area of the app to have a central API for setting "status"
 * Status is used to show errors, error state, and messages that result from
 * system or user actions.
 *
 * Having a API funnel through a central code path is useful for the following cases:
 * - Code that isn't directly called by the UI can trigger state to show errors or messages
 * - Library code can display errors / messages without needing to know implementation specifics
 * - Error and message state can be cleared on navigation events (when
 *   you navigate away from a page status is generally cleared)
 * - Multiple user elements that may trigger status changes can co-exist without the
 *   client code needing to coordinate state logic
 *
 * Status handling is hierarchical, using `React.context` and allowing components in the tree
 * to have their own handling.
 *
 * There are three levels at which you may want to handle status
 * 1. App-wide: Default handling for your app, may display the status in a "toast" or similar.
 *    This is important to have available for background operations - unless every action in the
 *    app is blocking, you want to be able to report when an operation fails.
 * 2. Screen-wide: Default handling for a screen layout, can display in a consistent location across
 *    multiple screens.
 * 3. Local: Can handle at the screen or component level if you have a specific display you want to
 *    use for showing the status.
 */
type StatusApi = {
  setError: (error: Opt<Error>) => void;
  setMessage: (text: Opt<string>) => void;
  clear: () => void;
  useStatus: () => Status;
};

/**
 * Type for the "status" of a page or the app, to show errors, error state, and
 * messages that result from system or user actions.
 *
 * If message is set, the message should be shown to the user.
 * If error is set, the error should be shown to the user in a UI that
 *   makes it clear it is an error.
 *
 * If both are set, generally the error overrides the message.
 */
type Status = {
  message: Opt<string>;
  error: Opt<Error>;
};

const STATUS_API_KEY = contextKey<StatusApi>('npe.action.status');

/**
 * Get and set screen-level error and message status.
 */
export function useStatus(): StatusApi & Status {
  const api = React.useContext(StatusApiContext)['screen'];
  const status = api.useStatus();
  return {...api, ...status};
}

/**
 * Get and set app-wide error and message status.
 */
export function useBackgroundStatus() {
  const api = React.useContext(StatusApiContext)['app'];
  const status = api.useStatus();
  return {...api, ...status};
}

/**
 * Default StatusApi that logs to console.
 */
const UnsetStatusApi = {
  setError: (error: Opt<Error>) => {
    if (error != null) {
      console.error(error);
    }
  },
  setMessage: (text: Opt<string>) => {
    if (text != null) {
      console.log(text);
    }
  },
  clear: () => {},
  useStatus: () => {
    throw new Error('Need a parent `<StatusContainer>` to call `useStatus()');
  },
};

/**
 * Context needs two values - one for local actions displayed in context,
 * and another for actions that can resolve while user is anywhere in the app.
 */
type StatusApiContext = {
  screen: StatusApi;
  app: StatusApi;
};

// We don't use appContext for Screen State, as app context is meant
// to have one global value per key, and screen state is per-screen.
const StatusApiContext = React.createContext<StatusApiContext>({
  screen: UnsetStatusApi,
  app: UnsetStatusApi,
});

export type StatusApiType = keyof StatusApiContext;

type StatusContainerProps = {
  children: React.ReactNode;
  top?: boolean;
};
/**
 * StatusContainer is a React Component border for handling status state.
 *
 * It doesn't show any UI, instead requires there to be at least one
 * component in scope that that calls `useStatus()` and renders the status correctly.
 */
export const StatusContainer = (props: StatusContainerProps) => {
  const {children, top = false} = props;
  const statusApiCtx = React.useContext(StatusApiContext);
  const [errorValue, setErrorValue] = React.useState<Opt<Error>>();
  const [messageValue, setMessageValue] = React.useState<Opt<string>>();

  function setError(error: Opt<Error>) {
    setMessageValue(null);
    setErrorValue(error);
  }

  function setMessage(text: Opt<string>) {
    setMessageValue(text);
    setErrorValue(null);
  }

  function clear() {
    setError(null);
    setMessage(null);
  }

  function useStatus() {
    return {message: messageValue, error: errorValue};
  }

  const screenApi = {setError: setError, setMessage, clear, useStatus};
  const appWideApi = top ? screenApi : statusApiCtx.app;

  return (
    <StatusApiContext.Provider value={{screen: screenApi, app: appWideApi}}>
      {children}
    </StatusApiContext.Provider>
  );
};

/**
 * Simple, non-configurable example of app-wide status display with
 * no dependencies beyond `react-native`, that shows the status in a
 * user "toast"
 *
 * Useful to get started but before you ship you should either:
 * (a) copy and modify, or
 * (b) use one of the awesome higher level libraries we're going
 * to create
 */
export const SimpleUserMessaging = (props: {style?: ViewStyle}) => {
  const {style} = props;
  const {clear, setError, setMessage, error, message} = useBackgroundStatus();
  const timeout = React.useRef<any>();
  const stateRef = React.useRef({msg: '', isError: false});
  const state = stateRef.current;
  const CLEAR_DELAY = 5000;

  let msg = '';
  let isError = false;
  if (message != null) {
    msg = message;
  } else if (error != null) {
    msg = typeof error === 'string' ? error : toUserMessage(error);
    isError = true;
  }
  const visible = message != null || error != null;

  updateStateAndSetClearTimeout();

  function updateStateAndSetClearTimeout() {
    if (state.msg !== msg || state.isError !== isError) {
      if (visible) {
        clearAfterDelay();
      }
      stateRef.current = {msg, isError};
    }
  }

  function clearAfterDelay() {
    // Remove existing clear timer
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      timeout.current = null;
      console.log('atc');
      clear();
    }, CLEAR_DELAY);
  }

  const api = {setError, setMessage, clear, useStatus};

  setInitialAppContext(STATUS_API_KEY, api);

  const colorStyle = isError ? S.errorBox : S.messageBox;

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

type StatuBarsProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Component to displays status inline in a page.
 *
 * This is a basic starter UI - apps should feel free to copy and
 * customize or implement status directly in their layout code.
 *
 * TODO: Consider moving this and SimpleUserMessaging to component
 */
export const StatusBar = (props: StatuBarsProps) => {
  const {style} = props;
  const {error, message} = useStatus();
  const {Body} = useComponents();
  let msg;
  let color;

  const visible = message != null || error != null;

  if (error != null) {
    msg = typeof error === 'string' ? error : toUserMessage(error);
    color = S.errorBox;
  } else if (message != null) {
    msg = message;
    color = S.messageBox;
  }

  return visible ? (
    <View style={[S.statusBar, color, style]}>
      <Body style={{color: '#333', fontWeight: 'bold'}}>
        Sorry, there was a problem:
      </Body>
      <Body style={{color: '#333'}}>{msg}</Body>
    </View>
  ) : null;
};

/**
 * @deprecated
 * Temporary bridge to `useBackgroundStatus()` until call sites are cleaned up.
 *
 * To clean up - switch to `useStatus()` for in-page messaging, or `useBackgroundStatus()` for
 * status that can show up on any page
 */
export function useUserMessaging() {
  const api = useBackgroundStatus();

  function showError(error: Error | string) {
    const err =
      typeof error == 'string' ? new CodedError('unknown', error) : error;
    api.setError(err);
  }

  function showMessage(text: string) {
    api.setMessage(text);
  }

  function clear() {
    api.clear();
  }

  return {showError, showMessage, clear};
}

const S = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 100,
    zIndex: 4,
    padding: 16,
    borderRadius: 16,
  },
  errorBox: {
    backgroundColor: '#FFDCBF',
  },
  messageBox: {
    backgroundColor: '#BDE5F8',
  },
  statusBar: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: {textAlign: 'center', fontSize: 16},
});

/**
 * Display an error message if the handler fails.
 * If success is passed in, display this message when succeeding.
 */
export function withUserMessage(handler: Handler, success?: string) {
  const {setMessage, setError} = useStatus();

  return async () => {
    try {
      await handler();
      if (success) {
        setMessage(success);
      }
    } catch (e) {
      setError(toError(e));
    }
  };
}

type Promiser<T> = () => Promise<T>;

/**
 * Wrap a method that returns a promise to show a user message if it fails.
 */
export function useMessageOnFail() {
  const {setError} = useStatus();

  return function msgOnFail<T>(wrapped: Promiser<T>): Promiser<T> {
    return () => {
      const result = wrapped();
      return result.catch(e => {
        setError(toError(e));
        throw e;
      });
    };
  };
}
