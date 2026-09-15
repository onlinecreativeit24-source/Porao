import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// GitHub Safety Warning এড়ানোর জন্য process.env বা ডামি কনফিগ ব্যবহার করা হয়েছে
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyApiKeyForSafety_XYZ123456",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "porao-dd00d.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "porao-dd00d",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "porao-dd00d.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

// Firebase অ্যাপ ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);

// Auth এবং Firestore সার্ভিস এক্সপোর্ট
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
