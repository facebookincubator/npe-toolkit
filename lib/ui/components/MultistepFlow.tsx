/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  LayoutAnimationConfig,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAction} from '@toolkit/core/client/Action';
import {LoginFlowBackButton} from '@toolkit/screens/login/LoginScreenParts';
import {useComponents} from './Components';
import {KeyboardDismissPressable} from './Tools';

type Props = {
  children?: React.ReactNode;
  onCancel?: () => void;
  onFinish: () => Promise<void> | void;
  animator?: Animator;
};

type Animator = {
  prevStyle?: ViewStyle;
  nextStyle?: ViewStyle;
  animation: LayoutAnimationConfig;
};

export const SLIDE_ANIMATOR: Animator = {
  prevStyle: {left: '-100%'},
  nextStyle: {left: '100%'},
  animation: LayoutAnimation.Presets.easeInEaseOut,
};

export const FADE_ANIMATOR: Animator = {
  animation: LayoutAnimation.create(800, 'easeInEaseOut', 'opacity'),
};

/**
 * Utility to help render a flow with multiple pages.
 *
 * Provides a contextual API for moving forward and back in the flow,
 * and hooks for when finished or cancelled.
 *
 * Goal is a compact API that enables defining a flow in a higher level component
 * can manage the shared state across items in the flow (see example below).
 *
 * Steps in the flow have requirement to show a next button and a back button.
 * (+ more here)
 *
 * Example:
 *
 * ```
 * function OnboardingFlow() {
 *   const {auth} = useAuth();
 *   const {navigate, goBack} = useNavigation();
 *
 *   function onFinish() {
 *     // If this throws, will display error to user
 *     await auth.checkLogin();
 *     navigate('Home');
 *   }
 *
 *   function setName(name: string) {
 *     // Update user in this case is a server API
 *     await updateUser({name});
 *   }
 *
 *   function setEmail(email: string) {
 *     await updateUser({email});
 *   }
 *
 *   return (<MultistepFlow onCancel={goBack} onFinish={onFinish}>
 *     <TextInputStep field={NAME} onNext={setName} />
 *     <TextInputStep field={EMAIL} onNext={setEmail} />
 *    </MultistepFlow>);
 * }
 */
// TODO: Make animation configurable
export function MultistepFlow(props: Props) {
  const {onCancel, animator = SLIDE_ANIMATOR} = props;
  const onFinish = useLatestCallback(props.onFinish);
  const children = React.Children.toArray(props.children);
  const [curPage, setCurPage] = React.useState(0);
  const {prevStyle, nextStyle, animation} = animator;

  async function next() {
    if (isLast()) {
      await onFinish.current();
    } else {
      LayoutAnimation.configureNext(animation);
      setCurPage(curPage + 1);
    }
  }

  async function back() {
    if (curPage == 0) {
      if (onCancel) {
        onCancel();
      }
    } else {
      LayoutAnimation.configureNext(animation);
      setCurPage(curPage - 1);
    }
  }

  function isLast() {
    return curPage === children.length - 1;
  }

  return (
    <FlowApiContext.Provider value={{next, back, isLast}}>
      <View style={{flex: 1}}>
        {children.map((child, index) => {
          const animStyle =
            index < curPage ? prevStyle : index > curPage ? nextStyle : {};

          return (
            animStyle && (
              <View style={[S.fullscreen, animStyle]} key={index}>
                {child}
              </View>
            )
          );
        })}
      </View>
    </FlowApiContext.Provider>
  );
}

/**
 * Use the latest value of a callback prop passed into a component.
 *
 * Can be used to ensure that callbacks aren't made to parent components with stale state.
 */
function useLatestCallback<I extends any[], T>(fn: (...args: I) => T) {
  const ref = React.useRef(fn);
  ref.current = fn;
  return ref;
}

type FlowApi = {
  next: () => Promise<void>;
  back: () => Promise<void>;
  isLast: () => boolean;
};

const FlowApiContext = React.createContext<FlowApi | null>(null);

/**
 * Use the flow API
 * Will this work for next/back enablement? Or do we just have to pass them in...
 */
export function useFlow(): FlowApi {
  const api = useContext(FlowApiContext);
  if (api == null) {
    throw Error('not null');
  }
  return api;
}

type StepProps = {
  title?: string;
  subtitle?: string;
  submitText?: string;
  required?: boolean;
  nextOk?: boolean;
  onNext?: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  children?: React.ReactNode;
};

/**
 * A convience layout container for a multi-step flow that automatically
 * adds buttons for back and next/skip/continue.
 *
 * Feel free to implement your own though :)
 */
export function Step(props: StepProps) {
  const {title, subtitle, submitText, onNext, onSkip, children} = props;
  const {required = true, nextOk = true} = props;
  const flow = useFlow();
  const {top} = useSafeAreaInsets();
  const {Button, Body, Title} = useComponents();
  const [onNextStep, loading] = useAction(nextStep);

  async function nextStep() {
    if (onNext) {
      await onNext();
    }
    await flow.next();
    Keyboard.dismiss();
  }

  async function skip() {
    if (onSkip) {
      await onSkip();
    }
    await flow.next();
    Keyboard.dismiss();
  }
  const skippy = React.useCallback(skip, [onSkip, flow]);

  const nextText = flow.isLast() ? submitText ?? 'Finish' : 'Continue';
  const skipText = flow.isLast() ? 'Skip & Finish' : 'Skip';

  return (
    <KeyboardAvoidingView
      style={S.containerRoot}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
      keyboardVerticalOffset={top}>
      <View style={[S.container]}>
        <KeyboardDismissPressable />
        <LoginFlowBackButton back={flow.back} />

        <View style={S.spaced}>
          <ScrollView style={{marginBottom: 20, flexGrow: 1}}>
            {title && <Title mb={16}>{title}</Title>}
            {subtitle && <Body>{subtitle}</Body>}
            <View style={S.content}>{children}</View>
          </ScrollView>
          <View>
            {!required && (
              <Button type="secondary" onPress={skippy} style={S.skip}>
                {skipText}
              </Button>
            )}
            <Button
              type="primary"
              onPress={onNextStep}
              disabled={!nextOk}
              loading={loading}>
              {nextText}
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  fullscreen: {
    flex: 1,
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
  },
  containerRoot: {
    flex: 1,
  },
  container: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
  },
  spaced: {
    marginTop: 18,
    flex: 1,
  },
  content: {
    marginTop: 32,
  },
  skip: {
    marginBottom: 12,
  },
});
