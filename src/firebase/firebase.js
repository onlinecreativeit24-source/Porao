import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBirgAkj9gbGYKjcUSsCFYLIJ6IoXbMK0E",
  authDomain: "porao-dd00d.firebaseapp.com",
  projectId: "porao-dd00d",
  storageBucket: "porao-dd00d.firebasestorage.app",
  messagingSenderId: "251968287983",
  appId: "1:251968287983:web:3d8f51cd438dbb6147171a"
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApp();

let auth;
if (Platform.OS === 'web' || !isNew) {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app, auth };
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');
