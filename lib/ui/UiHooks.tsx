/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {TextInput, TextInputProps} from 'react-native';

type NewProps = Omit<TextInputProps, 'value' | 'onChangeText'>;

/**
 * Hook that creates a text input already bound to React State.
 *
 * Usage:
 * ```
 * function MyComponent {
 *   const [NameInput, name] = useTextInput('');
 *   const [EmailInput, email] = useTextInput('');
 *
 *   async function save() {
 *     saveData(name, email);
 *     ...
 *   }
 *
 *   return (
 *     <View>
 *       <NameInput style={...}/>
 *       <EmailInput style={...}/>
 *       <Button onPress={save} title="Save"/>
 *     </View>
 *   }
 * }
 * const [TextInput, value] = useTextInput() {
 * }
 * ```
 *
 * Additioinal features:
 * - You can pass in a second parameter to define the TextInput component - it defaults to
 *   React Native's base TextInput. Requirement is that it has a "value" and "onChangeText" prop
 * - `useTextInput()` returns a setter in the third arrray element, but this is less frequently used
 *
 */
export function useTextInput(
  defaultValue: string,
  Component: React.ComponentType<TextInputProps> = TextInput,
): [React.ComponentType<NewProps>, string, Setter<string>] {
  const [value, setValue, state] = useSharedState(defaultValue);

  const component = (props: NewProps) => {
    const [value, setValue] = useParentState(state);
    return <Component {...props} value={value} onChangeText={setValue} />;
  };

  // Ref is needed for component equality for all renders of a hook by the same parent component.
  // Otherwise each render recreates initial state in the referenced component
  const componentRef = React.useRef(component);

  return [componentRef.current, value, setValue];
}

export type Setter<T> = (value: T) => void;

type SharedState<T> = {
  defaultValue: T;
  setShared: Setter<T>;
  registerSetter: (setter: Setter<T>) => void;
  unregisterSetter: (setter: Setter<T>) => void;
};

/**
 * A hook that allows sharing state between a parent component and a dynamically defined child component.

 *
 * Usage:
 * ```
 * type HookBasedTextInputProps = Omit<TextInputProps, 'value' | 'onChangeText'>;
 *
 * function useTextInput(defaultValue: string) {
 *   const [value, setValue, state] = useSharedState(defaultValue);
 *
 *   const component = (props: HookBasedTextInputProps) => {
 *     const [value, setValue] = useParentState(state);
 *     return <TextInput {...props} value={value} onChangeText={setValue} />;
 *   };
 *
 *   const componentRef = React.useRef(component);
 *
 *   return [componentRef.current, value, setValue];
 * }
 * ```
 *
 */
export function useSharedState<T>(
  defaultValue: T,
): [T, Setter<T>, SharedState<T>] {
  const [value, setValue] = React.useState<T>(defaultValue);
  const setters = React.useRef<Setter<T>[]>([]);

  const state = {
    defaultValue,

    setShared: React.useCallback(
      (newValue: T) => {
        setValue(newValue);
        for (const setter of setters.current) {
          setter(newValue);
        }
      },
      [setters],
    ),

    registerSetter: (setter: Setter<T>) => {
      setters.current.push(setter);
    },

    unregisterSetter: (setter: Setter<T>) => {
      const found = setters.current.indexOf(setter);
      if (found !== -1) {
        setters.current.splice(found, 1);
      }
    },
  };

  return [value, state.setShared, state];
}

/**
 * Partner to `useSharedState()` to use in dynamically defined child components- see notes in that function for usage.
 */
export function useParentState<T>(
  state: SharedState<T>,
): [T, Setter<T>, SharedState<T>] {
  const [value, setValue] = React.useState<T>(state.defaultValue);

  React.useEffect(() => {
    state.registerSetter(setValue);
    return () => {
      state.unregisterSetter(setValue);
    };
  }, []);

  return [value, state.setShared, state];
}
