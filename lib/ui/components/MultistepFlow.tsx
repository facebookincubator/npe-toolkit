/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useContext} from 'react';
import {
  LayoutAnimation,
  LayoutAnimationConfig,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

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
function MultistepFlow(props: Props) {
  const {onFinish, onCancel, animator = SLIDE_ANIMATOR} = props;
  const children = React.Children.toArray(props.children);
  const [curPage, setCurPage] = React.useState(0);
  const {prevStyle, nextStyle, animation} = animator;

  async function next() {
    if (isLast()) {
      await onFinish();
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

const S = StyleSheet.create({
  fullscreen: {
    flex: 1,
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
  },
});

export default MultistepFlow;
