/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import firebase from 'firebase/app';
import {useAppConfig} from '@toolkit/core/util/AppConfig';
import {uuidv4} from '@toolkit/core/util/Util';
import {
  getInstanceFor,
  getStoragePrefix,
} from '@toolkit/providers/firebase/Instance';
import 'firebase/storage';
import * as mime from 'mime';
import 'react-native-get-random-values';

export type StoredObjectData = {
  displayUrl: string;
  uri: string;
};

const FIREBASE_SCHEME = 'firebasestorage://';

/**
 * - Wrap in a component with loading indicator?
 * - Store metadata in firestore
 */
export const useFirebaseStorage = () => {
  const app = firebase.app();
  const storage = app.storage();
  const appConfig = useAppConfig();
  const instance = getInstanceFor(appConfig);
  const prefix = getStoragePrefix(instance);
  return {
    upload: async (
      folder: string,
      uri: string,
      customMetadata?: Record<string, string>,
      progress?: (snapshot: firebase.storage.UploadTaskSnapshot) => void,
      error?: (error: firebase.storage.FirebaseStorageError) => void,
    ): Promise<StoredObjectData> => {
      return new Promise(async (resolve, reject) => {
        const ext = getExtension(uri);
        const key = `${prefix}${folder}/${uuidv4()}.${ext}`;
        const storageRef = storage.ref();
        const ref = storageRef.child(key);

        const response = await fetch(uri);
        const file = await response.blob();

        const type = mime.getType(uri) ?? file.type;
        const uploadTask = ref.put(file, {
          contentType: type,
          customMetadata,
        });

        uploadTask.on(
          'state_changed',
          progress,
          uploadError => {
            if (error != null) error(uploadError);
            reject(uploadError);
          },
          async () => {
            const displayUrl = await ref.getDownloadURL();
            resolve({displayUrl, uri: FIREBASE_SCHEME + key});
          },
        );
      });
    },
    uploadBlob: async (
      folder: string,
      blob: Blob,
      extension: string,
      customMetadata?: Record<string, string>,
      progress?: (snapshot: firebase.storage.UploadTaskSnapshot) => void,
      error?: (error: firebase.storage.FirebaseStorageError) => void,
    ): Promise<StoredObjectData> => {
      const key = `${prefix}${folder}/${uuidv4()}.${extension}`;
      return await uploadFile(
        storage,
        key,
        blob,
        customMetadata,
        progress,
        error,
      );
    },
    download: async (key: string): Promise<string> => {
      if (key.indexOf('firebasestorage://') !== -1) {
        key = key.replace('firebasestorage://', '');
      }
      const ref = storage.ref(key);
      return await ref.getDownloadURL();
    },
    removeFile: async (key: string): Promise<string> => {
      if (key.indexOf('firebasestorage://') !== -1) {
        key = key.replace('firebasestorage://', '');
      }
      const ref = storage.ref(key);
      return await ref.delete();
    },
  };
};

const uploadFile = async (
  storage: firebase.storage.Storage,
  key: string,
  blob: Blob,
  customMetadata?: Record<string, string>,
  progress?: (snapshot: firebase.storage.UploadTaskSnapshot) => void,
  error?: (error: firebase.storage.FirebaseStorageError) => void,
): Promise<StoredObjectData> => {
  return new Promise(async (resolve, reject) => {
    const storageRef = storage.ref();
    const ref = storageRef.child(key);
    const type = blob.type;

    const uploadTask = ref.put(blob, {
      contentType: type,
      customMetadata,
    });

    uploadTask.on(
      'state_changed',
      progress,
      uploadError => {
        if (error != null) error(uploadError);
        reject(uploadError);
      },
      async () => {
        const displayUrl = await ref.getDownloadURL();
        resolve({displayUrl, uri: FIREBASE_SCHEME + key});
      },
    );
  });
};

const getExtension = (uri: string): string => {
  if (uri.startsWith('data:')) {
    const endswithExtension = uri.split(';')[0];
    return endswithExtension.split('/')[1];
  } else {
    const tokens = uri.split('.');
    return tokens[tokens.length - 1];
  }
};
