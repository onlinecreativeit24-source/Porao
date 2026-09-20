import React, { createContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, sendPasswordResetEmail,
  updateProfile, signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export const AuthContext = createContext();

// users/{uid} ডকুমেন্ট না থাকলে বানায়। ব্যর্থ হলেও লগইন আটকাবে না।
const saveProfile = async (u, role, name) => {
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: name || u.displayName || '',
        email: u.email || '',
        role: role || 'student',
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.warn('প্রোফাইল সেভ হয়নি:', e.message);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser({
        uid: u.uid,
        email: u.email,
        name: u.displayName || (u.email ? u.email.split('@')[0] : ''),
      });
      setLoading(false);
      // রোল ফায়ারস্টোর থেকে আসে (ডকুমেন্ট তৈরি হলেই আপডেট হবে)
      unsubProfile = onSnapshot(
        doc(db, 'users', u.uid),
        (snap) => {
          if (snap.exists()) {
            setUser((prev) => (prev && prev.uid === u.uid ? { ...prev, role: snap.data().role } : prev));
          }
        },
        () => {}
      );
    });
    return () => {
      unsub();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const loginWithGoogle = async (role) => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await saveProfile(cred.user, role);
  };

  const login = (email, pass) =>
    signInWithEmailAndPassword(auth, email, pass);

  const signup = async (name, email, pass, role) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
      setUser((prev) => (prev && prev.uid === cred.user.uid ? { ...prev, name } : prev));
    }
    await saveProfile(cred.user, role, name);
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
