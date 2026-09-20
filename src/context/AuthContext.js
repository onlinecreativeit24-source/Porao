
import React, { createContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, sendPasswordResetEmail,
  updateProfile, signOut
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? {
        uid: u.uid,
        email: u.email,
        name: u.displayName || (u.email ? u.email.split('@')[0] : ''),
      } : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  const login = (email, pass) =>
    signInWithEmailAndPassword(auth, email, pass);

  const signup = async (name, email, pass) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) await updateProfile(cred.user, { displayName: name });
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, login, signup, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
