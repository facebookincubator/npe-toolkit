/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {ReactNode} from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '@toolkit/core/client/Theme';
import {CodedError} from '@toolkit/core/util/CodedError';

/**
 * A frame for showing content that has a loading state, triggered when content isn't yet ready,
 * and an error state, triggered when the content fails to load correctly.
 *
 * Both states have a basic default UI that can be overridden.
 */

export type ErrorScreenProps = {
  message: string;
  debug?: string | null;
  error?: Error | null;
};

export type ErrorHandler = (err: Error | CodedError) => boolean;

type Props = {
  children: ReactNode;
  loadingView?: React.ComponentType<{}>;
  errorView?: React.ComponentType<ErrorScreenProps>;
  onError?: ErrorHandler;
};

// Loaded state never gets officially set in code below
// but keeping for documentation - it's what happens if
// the <React.Suspense> renders without an exception in the child nodes
type State = {
  uistate: 'loading' | 'loaded' | 'error';
  error: Error | null;
  lastCaught: Error | null;
  componentStack: string | null;
};

const LOADING_TEXT = 'Loading...';
const ERROR_TEXT = "I'm sorry Dave, I'm afraid I can't do that";

class TriState extends React.Component<Props, State> {
  state: State = {
    uistate: 'loading',
    error: null,
    lastCaught: null,
    componentStack: null,
  };

  render(): ReactNode {
    const {uistate, error, componentStack} = this.state;
    const {children, loadingView, errorView} = this.props;

    const LoadingView = loadingView || messageScreen(LOADING_TEXT);
    const ErrorView = errorView || DefaultErrorScreen;

    if (uistate === 'error') {
      const debug =
        error instanceof Error ? debugInfo(error, componentStack) : null;

      const message =
        error instanceof CodedError ? error.userVisibleMessage : ERROR_TEXT;

      return <ErrorView message={message} debug={debug} error={error} />;
    }

    return (
      <React.Suspense fallback={<LoadingView />}>{children}</React.Suspense>
    );
  }

  // $FlowFixMe[incompatible-extend]
  componentDidCatch(error: Error, {componentStack}: HasComponentStack): void {
    const {onError} = this.props;

    if (onError && onError(error)) {
      // This code path is causing problems and is likely not needed.
      // Notably, this can contine rendering the same component even after
      // an error is caught (as uistate isn't `error`), and this caused a blank
      // screen in some cases.

      // New clients should return "false" to onError in all cases.

      // TODO: Update existing clients to return false from onError() and remove this block
      this.setState({lastCaught: error});
      return;
    }
    this.setState({error, uistate: 'error', componentStack});
  }
}

interface HasComponentStack {
  componentStack: string | null;
}

/**
 * Add RN component stack and clean-up noncomponent stack,
 * (without this get a bunch of really long dev URLs)
 */
function debugInfo(error: Error, componentStack?: string | null) {
  let stack = error.message + `\n\n`;

  if (componentStack != null) {
    stack = stack + `Component stack:${componentStack}\nStack trace:\n`;
  }

  stack += error.stack
    ?.replace(/https?:.*\//g, '')
    .replace(/\.bundle\?.*?:/g, ':')
    .replace(/tryCatch@[\s\S]*/, '');

  return stack;
}

function messageScreen(content: string): React.ComponentType<{}> {
  return () => (
    <View style={{padding: 30}}>
      <Text>{content}</Text>
    </View>
  );
}

function DefaultErrorScreen(props: ErrorScreenProps) {
  const {message, debug} = props;
  const [showDebug, setShowDebug] = React.useState(false);
  const theme = useTheme();

  return (
    <SafeAreaView style={{marginHorizontal: 10}}>
      <ScrollView style={{paddingTop: 16}}>
        <View>
          <Text style={{color: theme.textColor}}>{message}</Text>
        </View>
        <TouchableOpacity
          style={{paddingTop: 20}}
          onPress={() => setShowDebug(!showDebug)}>
          <Text
            style={{textDecorationLine: 'underline', color: theme.textColor}}>
            Debug Info
          </Text>
        </TouchableOpacity>
        {showDebug && debug != null && (
          <View style={{paddingTop: 20}}>
            <Text style={{color: theme.textColor}}>{debug}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default TriState;
