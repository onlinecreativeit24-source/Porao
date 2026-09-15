import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBirgAk9jbGYKjcUSsCFYLIJ6IoXbMK0E",
  authDomain: "porao-dd00d.firebaseapp.com",
  projectId: "porao-dd00d",
  storageBucket: "porao-dd00d.firebasestorage.app",
  messagingSenderId: "251968287983",
  appId: "1:251968287983:web:3d8f51cd438dbb6147171a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
