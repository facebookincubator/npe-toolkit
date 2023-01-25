/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import firebase from 'firebase/app';
import 'firebase/auth';
import * as React from 'react';
import {
  Account,
  AuthType,
  AUTH_SERVICE_KEY,
  LoginCredential,
} from '@toolkit/core/api/Auth';
import IdentityService from '@toolkit/core/api/Login';
import {User} from '@toolkit/core/api/User';
import {LOGGED_IN_USER_API_KEY} from '@toolkit/core/api/User';
import {NotLoggedInError} from '@toolkit/tbd/CommonErrors';
import {networkDelay} from '@toolkit/core/util/DevUtil';
import {useAppConfig} from '@toolkit/core/util/AppConfig';
import {
  setInitialAppContext,
  useSetAppContext,
} from '@toolkit/core/util/AppContext';
import Promised from '@toolkit/core/util/Promised';
import {useFirebaseApp} from '@toolkit/providers/firebase/Config';
import {useFirebasePhoneAuth} from '@toolkit/providers/firebase/client/PhoneUtil';

const {
  FacebookAuthProvider,
  GoogleAuthProvider,
  PhoneAuthProvider,
  OAuthProvider,
} = firebase.auth;

/**
 * Callback to create app-specific user from the account.
 *
 * This includes backend-specific `firebase.User` so we don't have to duplicate all of the fields,
 * which means the call signature will be different if you switch to a different backend.
 *
 * TODO: Decide if we should normalize all of these account fields into Account, and if so switch
 */
type UserCallback<UserType extends User> = (
  account: Account,
  firebaseAccount: firebase.User,
) => Promise<UserType>;

type Props = {
  userCallback: UserCallback<User>;
  children?: React.ReactNode;
};

/**
 * Map of phone #s to the most recent verification IDs.
 *
 * Firebase phone login requires a "verifier", which is used to prevent abuse.
 * This associates verifiers with phone #'s so we don't have to expose the API to clients.
 */
// TODO: The in-memory version of these gets cleared on some code reloads,
// causing confusing errors during development.
// If this persists, consider serializing
const VERIFICATION_IDS: Record<string, string> = {};

/**
 * To re-render component tree after auth state changes
 */
function useAuthReload() {
  const [reloadCount, setReloadCount] = React.useState(0);
  return () => {
    setReloadCount(reloadCount + 1);
  };
}

/**
 *  Component that provides LoginService and User
 */
export function FirebaseAuthService(props: Props) {
  const {userCallback, children} = props;
  const app = useFirebaseApp();
  const auth = firebase.auth(app);
  const product = useAppConfig().product;
  const setUseLoggedInUser = useSetAppContext(LOGGED_IN_USER_API_KEY);
  const [FirebaseRecaptcha, sendPhoneVerification] = useFirebasePhoneAuth();
  const user = React.useRef<User | null>(null);
  const account = React.useRef<Account | null>(null);
  const initialized = React.useRef(false);
  const authReload = useAuthReload();

  async function accountChange(
    firebaseAccount: firebase.User | null,
  ): Promise<User | null> {
    let newAccount = await toAccount(firebaseAccount);
    let newUser: User | null = null;

    try {
      if (newAccount !== null && firebaseAccount !== null) {
        newUser = await userCallback(newAccount, firebaseAccount);
      }
      return newUser;
    } finally {
      // User only is set as logged in if "canLogin" = true
      let newLoggedInUser = newUser?.canLogin ? newUser : null;

      // You can be authenticated with Firebase if you have a user in the database
      // that isn't yet enabled for `canLogin`. However if you don't have a user in the database,
      // checkLogin() will always fail and so we log out of Firebase entirely.
      //
      if (newUser === null) {
        auth.signOut();
      }

      account.current = newAccount;
      if (!initialized.current || newLoggedInUser?.id !== user.current?.id) {
        user.current = newLoggedInUser;
        initialized.current = true;
        setUseLoggedInUser(useLoggedInUser);
        authReload();
      }
    }
  }

  async function firstInit() {
    await IdentityService.init();
    const firebaseAccount = await waitForFirebaseAccount(app, product);
    await accountChange(firebaseAccount);
  }

  // Load initial Firebase account at startup
  React.useEffect(() => {
    firstInit();
  }, [auth]);

  async function tryConnect(
    type: AuthType,
    opts?: {scopes?: string[]},
  ): Promise<LoginCredential> {
    const scopes = opts?.scopes || [];
    return await IdentityService.tryConnect(type, product, scopes);
  }

  async function sendCode(type: AuthType, to: string): Promise<void> {
    if (type === 'phone') {
      const verificationId = await sendPhoneVerification(to);
      VERIFICATION_IDS[to] = verificationId;
    } else {
      throw Error(`Can't send code for auth type ${type}.`);
    }
  }

  async function login(creds: LoginCredential): Promise<User> {
    const type = creds.type;

    let cred;
    switch (type) {
      case 'facebook':
        cred = FacebookAuthProvider.credential(creds.token);
        break;
      case 'google':
        cred = GoogleAuthProvider.credential(creds.token);
        break;
      case String(type.match(/oidc.*/)):
        const openIdConnectProvider = new OAuthProvider(type);
        cred = openIdConnectProvider.credential({
          idToken: creds.token,
        });
        break;
      case 'phone':
        cred = PhoneAuthProvider.credential(
          VERIFICATION_IDS[creds.id!],
          creds.token,
        );
        break;
      default:
        throw Error(`Unsupported auth type for Firebase login: ${type}`);
    }

    const firebaseCred = await auth.signInWithCredential(cred);
    const firebaseAccount = firebaseCred.user;
    const newUser = await accountChange(firebaseAccount);

    // Refresh the token so any new claims are reflected
    if (firebaseAccount) {
      await firebaseAccount.getIdToken(true);
    }

    if (newUser == null) {
      throw Error('unsuccesful login');
    }
    return newUser;
  }

  async function checkLogin(): Promise<User> {
    const firebaseAccount = firebase.auth().currentUser;
    if (account.current == null || firebaseAccount == null) {
      throw NotLoggedInError();
    }

    const newUser = await userCallback(account.current, firebaseAccount);
    // Refresh the token so any new claims are reflected
    await firebaseAccount.getIdToken(true);

    // TODO: Share logic across different calls to userCallback
    if (newUser.canLogin) {
      user.current = newUser;
      authReload();
    }

    // TODO: Need ways of handling different invalid user states
    return newUser;
  }

  async function logout(): Promise<void> {
    await auth.signOut();
    await accountChange(null);
  }

  async function getLoggedInUser(): Promise<User | null> {
    if (initialized.current) {
      return user.current;
    }

    await waitForFirebaseAccount(app, product);
    const firebaseAccount = firebase.auth().currentUser;
    return await accountChange(firebaseAccount);
  }

  function useLoggedInUser(): User | null {
    if (!initialized.current) {
      // Throwing this promise will make React.Suspense
      // wait until it has resolved before trying again
      throw getLoggedInUser();
    }
    return user.current;
  }

  const api = {
    tryConnect,
    sendCode,
    login,
    checkLogin,
    logout,
    getLoggedInUser,
  };

  // TODO: This line is a problem. Components may have a reference to a previous version of ULIU
  setInitialAppContext(LOGGED_IN_USER_API_KEY, useLoggedInUser);
  // TODO: Memoize
  setInitialAppContext(AUTH_SERVICE_KEY, api);

  return (
    <>
      {children}
      <FirebaseRecaptcha />
    </>
  );
}

async function toAccount(
  firebaseAccount: firebase.User | null,
): Promise<Account | null> {
  if (firebaseAccount == null) {
    return null;
  }
  return {
    id: firebaseAccount.uid,
    token: await firebaseAccount.getIdToken(),
    type: 'firebase',
  };
}

// Promise to get current firebase acccount
// TODO: Move to common util
function firebaseAuthLoadPromise(
  app: firebase.app.App,
): Promised<firebase.User | null> {
  return new Promised(
    new Promise((resolve, reject) => {
      // TODO: Set a timeout that cancels if we never get a user
      firebase.auth().onAuthStateChanged(
        async user => {
          await networkDelay();
          resolve(user);
        },
        error => reject(error),
      );
    }),
  );
}

// Stored outside components, keyed by product to avoid managing in react state
const authPromises: {[key: string]: Promised<firebase.User | null>} = {};

function waitForFirebaseAccount(app: firebase.app.App, key: string) {
  let authPromise = authPromises[key];
  if (!authPromise) {
    authPromises[key] = firebaseAuthLoadPromise(app);
    authPromise = authPromises[key];
  }
  return authPromise;
}

function throwIfFirebaseAccountLoading(app: firebase.app.App, key: string) {
  const loading = waitForFirebaseAccount(app, key);
  // Throws if account not loaded
  loading.getValue();
}

/**
 * User type, only available for testing
 */
export type FirebaseExampleUser = User & {
  greeting: string;
};

/**
 * YOU WILL NEED TO REPLACE THIS BEFORE LAUNCHING
 *
 * ProductLogin, based on Firebase basckend, which creates users locally on the client
 * from Facebook account credentials.
 *
 * Why it can't be used for prod:
 * - Almost all apps launch with a server-controlled user allowlist - you can't just
 *   let anyone log in and use the app. Even for mobile apps, allowlist is needed to control
 *   access to the server endpoints
 * - Apps will want to store user data in separate firebase users table so that it is editable.
 *   (e.g. users want to change their profile pic)
 * - May want other user fields as well
 */
export async function exampleFirebaseUserCallback(
  account: Account,
  firebaseAccount: firebase.User,
): Promise<FirebaseExampleUser> {
  if (
    firebaseAccount == null ||
    firebaseAccount.uid !== account.id ||
    (firebaseAccount.email == null && firebaseAccount.phoneNumber == null)
  ) {
    throw Error('Invalid account for login');
  }

  const name =
    firebaseAccount.displayName ||
    firebaseAccount.email ||
    firebaseAccount.phoneNumber ||
    'anon';

  return {
    id: firebaseAccount.uid,
    name,
    pic: firebaseAccount.photoURL,
    email: firebaseAccount.email,
    canLogin: true,
    greeting: `Hello ${name}`,
  };
}
