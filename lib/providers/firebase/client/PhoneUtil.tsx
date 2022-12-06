/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import {FirebaseRecaptchaVerifierModal} from 'expo-firebase-recaptcha';
import firebase from 'firebase/app';
import 'firebase/auth';
import React, {ComponentType, useRef} from 'react';

type SendVerificationCode = (phoneNumber: string) => Promise<string>;

export const useFirebasePhoneAuth = (): [
  ComponentType,
  SendVerificationCode,
] => {
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const auth = firebase.auth();

  const sendVerificationCode = async (phoneNumber: string) => {
    const phoneProvider = new firebase.auth.PhoneAuthProvider(auth);

    const verifier = recaptchaVerifier.current!;
    // @ts-ignore
    verifier._reset = () => {};

    // TODO: Catch any backend errors and rethrow CodedError
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      verifier,
    );

    return verificationId;
  };

  const FirebaseRecaptcha = () => {
    return (
      <>
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebase.app().options}
          attemptInvisibleVerification={true}
        />
      </>
    );
  };

  return [FirebaseRecaptcha, sendVerificationCode];
};
