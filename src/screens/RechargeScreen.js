import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { db, functions } from '../firebase/firebase';

// শুধু দেখানোর জন্য। আসল দাম ও কয়েন সার্ভারে ঠিক করা (functions/index.js)
const PACKS = [
  { id: 'p5', coins: 5, amount: 50, label: '৫ কয়েন', price: '৳৫০' },
  { id: 'p12', coins: 12, amount: 100, label: '১২ কয়েন', price: '৳১০০', tag: '২টি ফ্রি' },
];

export default function RechargeScreen() {
  const { user } = useContext(AuthContext);
  const [packId, setPackId] = useState('p12');
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const unsubRef = useRef(null);

  useEffect(() => () => { if (unsubRef.current) unsubRef.current(); }, []);

  const watchOrder = (orderId) => {
    if (unsubRef.current) unsubRef.current();
    setWaiting(true);
    unsubRef.current = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      const st = snap.data()?.status;
      if (st === 'paid') {
        unsubRef.current && unsubRef.current();
        setWaiting(false);
        Alert.alert('✅ পেমেন্ট সফল', `${snap.data().coins} কয়েন যোগ হয়েছে।`);
      } else if (st === 'review') {
        unsubRef.current && unsubRef.current();
        setWaiting(false);
        Alert.alert('যাচাই দরকার', 'পেমেন্টটি অ্যাডমিন যাচাই করবে।');
      }
    });
  };

  const pay = async () => {
    setBusy(true);
    try {
      const create = httpsCallable(functions, 'createPayment');
      const res = await create({ packId });
      const { orderId, paymentUrl } = res.data;
      watchOrder(orderId);
      await WebBrowser.openBrowserAsync(paymentUrl);
    } catch (e) {
      const m = e?.code === 'functions/resource-exhausted'
        ? 'কিছুক্ষণ পরে আবার চেষ্টা করুন।'
        : 'পেমেন্ট শুরু করা যায়নি, আবার চেষ্টা করুন।';
      Alert.alert('সমস্যা হয়েছে', m);
    }
    setBusy(false);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <View style={s.balance}>
        <Text style={s.balLabel}>আপনার কয়েন</Text>
        <Text style={s.balNum}>{user?.coins ?? 0}</Text>
      </View>

      <Text style={s.h}>প্যাক বেছে নিন</Text>
      {PACKS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={[s.pack, packId === p.id && s.packActive]}
          onPress={() => setPackId(p.id)}
        >
          <View>
            <Text style={s.packTitle}>{p.label}</Text>
            {!!p.tag && <Text style={s.tag}>{p.tag}</Text>}
          </View>
          <Text style={s.price}>{p.price}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={pay} disabled={busy}>
        {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>পেমেন্ট করুন</Text>}
      </TouchableOpacity>

      {waiting && (
        <View style={s.wait}>
          <ActivityIndicator />
          <Text style={s.waitText}>পেমেন্টের নিশ্চিতকরণের অপেক্ষায়… কয়েন নিজে থেকেই যোগ হবে।</Text>
        </View>
      )}

      <Text style={s.note}>
        🔒 পেমেন্ট নিরাপদ UddoktaPay পেজে হয়। আপনার কার্ড বা পিন আমরা দেখি না।
        কয়েন যোগ হতে কয়েক সেকেন্ড লাগতে পারে।
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  balance: { backgroundColor: '#2563EB', borderRadius: 16, padding: 20, alignItems: 'center' },
  balLabel: { color: '#DBEAFE' },
  balNum: { color: '#FFF', fontSize: 40, fontWeight: '800', marginTop: 4 },
  h: { fontWeight: '700', fontSize: 16, color: '#0F172A', marginTop: 22, marginBottom: 10 },
  pack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 16, marginBottom: 10 },
  packActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  packTitle: { fontWeight: '700', fontSize: 17, color: '#0F172A' },
  tag: { color: '#16A34A', fontWeight: '600', marginTop: 2 },
  price: { fontWeight: '800', fontSize: 18, color: '#2563EB' },
  btn: { backgroundColor: '#16A34A', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  wait: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  waitText: { flex: 1, color: '#475569' },
  note: { color: '#64748B', marginTop: 22, lineHeight: 20 },
});
