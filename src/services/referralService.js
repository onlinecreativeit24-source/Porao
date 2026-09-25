// referralService.js
// Porao App — Invite / Referral System
// Drop this into: src/services/referralService.js
// Requires: firebase (auth + firestore) already initialized in your project

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

const db = getFirestore();

// ---------- CONFIG ----------
// পরিবর্তন করে তোমার রিওয়ার্ড নিয়ম বসাও
export const REFERRAL_REWARD_RULES = {
  perReferral: 10, // প্রতি সফল রেফারে ১০ পয়েন্ট/কয়েন
  milestoneBonus: [
    { count: 5, bonus: 50, label: '৫ জন রেফারে বোনাস' },
    { count: 10, bonus: 150, label: '১০ জন রেফারে বোনাস' },
  ],
};

// ---------- 1. রেফারেল কোড তৈরি (প্রতি ইউজারের জন্য ইউনিক) ----------
function generateCode(uid, name = '') {
  const base = (name || uid).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const suffix = uid.slice(-4).toUpperCase();
  return `${base || 'PORA'}${suffix}`;
}

// প্রথমবার কল করো — সাইনআপ সম্পন্ন হওয়ার পর
export async function ensureReferralCode(uid, displayName) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const existing = snap.exists() ? snap.data().referralCode : null;
  if (existing) return existing;

  const code = generateCode(uid, displayName);
  await setDoc(
    userRef,
    {
      referralCode: code,
      referralCount: 0,
      referralPoints: 0,
      referredUsers: [],
      createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
    },
    { merge: true }
  );
  return code;
}

// ---------- 2. নতুন ইউজার সাইনআপের সময় কোড যাচাই ও ক্রেডিট ----------
// AuthContext-এ সাইনআপ ফাংশনে, ইউজার তৈরি হওয়ার পরপরই কল করো
export async function applyReferralCode(newUserUid, enteredCode) {
  if (!enteredCode) return { success: false, reason: 'no-code' };

  const q = query(collection(db, 'users'), where('referralCode', '==', enteredCode.trim().toUpperCase()));
  const results = await getDocs(q);

  if (results.empty) return { success: false, reason: 'invalid-code' };

  const referrerDoc = results.docs[0];
  const referrerId = referrerDoc.id;

  if (referrerId === newUserUid) return { success: false, reason: 'self-referral' };

  // নতুন ইউজারকে referredBy সেট করো (একবারই সম্ভব)
  const newUserRef = doc(db, 'users', newUserUid);
  const newUserSnap = await getDoc(newUserRef);
  if (newUserSnap.exists() && newUserSnap.data().referredBy) {
    return { success: false, reason: 'already-referred' };
  }

  await setDoc(newUserRef, { referredBy: referrerId }, { merge: true });

  // রেফারারকে পয়েন্ট ও কাউন্ট দাও
  const referrerRef = doc(db, 'users', referrerId);
  await updateDoc(referrerRef, {
    referralCount: increment(1),
    referralPoints: increment(REFERRAL_REWARD_RULES.perReferral),
    referredUsers: arrayUnion(newUserUid),
  });

  // মাইলস্টোন বোনাস চেক
  const updatedReferrerSnap = await getDoc(referrerRef);
  const newCount = updatedReferrerSnap.data().referralCount || 0;
  const milestone = REFERRAL_REWARD_RULES.milestoneBonus.find((m) => m.count === newCount);
  if (milestone) {
    await updateDoc(referrerRef, {
      referralPoints: increment(milestone.bonus),
    });
  }

  return { success: true, referrerId, milestoneHit: milestone || null };
}

// ---------- 3. ইউজারের রেফারেল স্ট্যাটাস আনা (Invite স্ক্রিনে দেখানোর জন্য) ----------
export async function getReferralStats(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    code: data.referralCode || null,
    count: data.referralCount || 0,
    points: data.referralPoints || 0,
    referredUsers: data.referredUsers || [],
  };
}
