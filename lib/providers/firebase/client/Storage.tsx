/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import firebase from 'firebase/app';
import 'firebase/storage';
import * as mime from 'mime';
import 'react-native-get-random-values';
import {uuidv4} from '@toolkit/core/util/Util';
import {getFirebaseConfig} from '@toolkit/providers/firebase/Config';

export type StoredObjectData = {
  displayUrl: string;
  uri: string;
};

const FIREBASE_SCHEME = 'firebasestorage://';

// TODO(rachitnanda): Move to @npe/lib
/**
 * - Wrap in a component with loading indicator?
 * - Store metadata in firestore
 */
export const useFirebaseStorage = () => {
  const app = firebase.app();
  const storage = app.storage();
  const config = getFirebaseConfig();
  const prePath = config?.namespace ? `${config.namespace}/` : '';
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
        const key = `${prePath}${folder}/${uuidv4()}.${ext}`;
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
      const key = `${prePath}${folder}/${uuidv4()}.${extension}`;
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
  const tokens = uri.split('.');
  return tokens[tokens.length - 1];
};