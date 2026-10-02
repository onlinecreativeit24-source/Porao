import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/firebase';

const MAXDIM = 1000;
const QUALITY = 0.62;
const MAXLEN = 850000; // Firestore ডকুমেন্টের সীমার ভেতরে থাকার জন্য

const DOCT = {
  nid: 'জাতীয় পরিচয়পত্র (NID)',
  passport: 'পাসপোর্ট',
  student: 'শিক্ষা প্রতিষ্ঠানের আইডি কার্ড',
};

const typesFor = (role) =>
  role === 'student' ? ['student', 'nid'] : ['nid', 'passport'];

export default function VerifyIDScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // null | pending | approved | rejected
  const [record, setRecord] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [docType, setDocType] = useState(typesFor(user?.role)[0]);
  const [image, setImage] = useState(null); // data URL
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'verifications', user.uid));
      if (snap.exists()) {
        setRecord(snap.data());
        setStatus(snap.data().status);
      } else {
        setRecord(null);
        setStatus(null);
      }
    } catch (e) {
      setMsg('ভেরিফিকেশনের তথ্য লোড হয়নি।');
    }
    try {
      const a = await getDoc(doc(db, 'admins', user.uid));
      setIsAdmin(a.exists());
    } catch (e) {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const process = async (uri) => {
    setMsg('ছবি প্রস্তুত হচ্ছে…');
    try {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.resize({ width: MAXDIM });
      const rendered = await ctx.renderAsync();
      const saved = await rendered.saveAsync({
        compress: QUALITY, format: SaveFormat.JPEG, base64: true,
      });
      const data = 'data:image/jpeg;base64,' + saved.base64;
      if (data.length > MAXLEN) {
        setImage(null);
        setMsg('ছবিটি এখনো বড়। আরেকটু কাছ থেকে তুলুন।');
        return;
      }
      setImage(data);
      setMsg('ছবি ঠিক আছে। এবার "জমা দিন" চাপুন।');
    } catch (e) {
      setImage(null);
      setMsg('ছবি প্রসেস করা যায়নি, আরেকবার চেষ্টা করুন।');
    }
  };

  const pick = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('অনুমতি দরকার', 'সেটিংস থেকে অনুমতি দিন।');
      return;
    }
    const opts = { mediaTypes: ['images'], quality: 1 };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]?.uri) await process(res.assets[0].uri);
  };

  const submit = async () => {
    if (!image) { setMsg('আগে একটা ছবি বেছে নিন।'); return; }
    setBusy(true);
    try {
      await setDoc(doc(db, 'verifications', user.uid), {
        uid: user.uid,
        name: user.name || '',
        role: user.role || '',
        docType,
        image,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setImage(null);
      setMsg('');
      Alert.alert('জমা হয়েছে', 'যাচাইয়ের পর প্রোফাইলে "ভেরিফায়েড" দেখাবে।');
      await load();
    } catch (e) {
      setMsg('জমা হয়নি, আবার চেষ্টা করুন।');
    }
    setBusy(false);
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" /></View>;
  }

  const canSubmit = status === null || status === 'rejected';

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.h1}>🆔 আইডি ভেরিফিকেশন</Text>
      <Text style={s.note}>ছবি শুধু অ্যাডমিন যাচাইয়ের জন্য ব্যবহার হয়, অন্য কেউ দেখতে পায় না।</Text>

      {status === 'approved' && (
        <View style={[s.badge, s.ok]}><Text style={s.okText}>✅ আপনার অ্যাকাউন্ট ভেরিফায়েড</Text></View>
      )}
      {status === 'pending' && (
        <View style={[s.badge, s.pending]}>
          <Text style={s.pendingText}>⏳ যাচাই চলছে</Text>
          <Text style={s.sub}>{DOCT[record?.docType] || ''} জমা দিয়েছেন।</Text>
        </View>
      )}
      {status === 'rejected' && (
        <View style={[s.badge, s.rejected]}>
          <Text style={s.rejectedText}>❌ প্রত্যাখ্যাত</Text>
          <Text style={s.sub}>{record?.note || 'ছবি স্পষ্ট ছিল না বা তথ্য মেলেনি।'}</Text>
        </View>
      )}

      {canSubmit && (
        <View style={{ marginTop: 18 }}>
          <Text style={s.label}>ডকুমেন্টের ধরন</Text>
          <View style={s.seg}>
            {typesFor(user?.role).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.segBtn, docType === t && s.segActive]}
                onPress={() => setDocType(t)}
              >
                <Text style={[s.segText, docType === t && { color: '#FFF' }]}>{DOCT[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>ছবি (স্পষ্ট, সব তথ্য দেখা যায় এমন)</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.pickBtn} onPress={() => pick(true)}>
              <Text style={s.pickText}>📷 ক্যামেরা</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.pickBtn} onPress={() => pick(false)}>
              <Text style={s.pickText}>🖼️ গ্যালারি</Text>
            </TouchableOpacity>
          </View>

          {!!image && <Image source={{ uri: image }} style={s.preview} resizeMode="contain" />}
          {!!msg && <Text style={s.msg}>{msg}</Text>}

          <TouchableOpacity
            style={[s.submit, (!image || busy) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={!image || busy}
          >
            {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitText}>জমা দিন</Text>}
          </TouchableOpacity>
        </View>
      )}

      {!canSubmit && !!msg && <Text style={s.msg}>{msg}</Text>}

      {isAdmin && (
        <TouchableOpacity style={s.adminBtn} onPress={() => navigation.navigate('AdminVerify')}>
          <Text style={s.adminText}>🛡️ পেন্ডিং ভেরিফিকেশন দেখুন (অ্যাডমিন)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  h1: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  note: { color: '#64748B', marginTop: 6, lineHeight: 20 },
  sub: { color: '#475569', marginTop: 4 },
  badge: { borderRadius: 12, padding: 14, marginTop: 16 },
  ok: { backgroundColor: '#DCFCE7' }, okText: { color: '#166534', fontWeight: '700' },
  pending: { backgroundColor: '#FEF9C3' }, pendingText: { color: '#854D0E', fontWeight: '700' },
  rejected: { backgroundColor: '#FEE2E2' }, rejectedText: { color: '#991B1B', fontWeight: '700' },
  label: { fontWeight: '600', color: '#0F172A', marginTop: 14, marginBottom: 8 },
  seg: { gap: 8 },
  segBtn: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, backgroundColor: '#FFF' },
  segActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  segText: { color: '#0F172A' },
  row: { flexDirection: 'row', gap: 10 },
  pickBtn: { flex: 1, borderWidth: 1, borderColor: '#2563EB', borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: '#FFF' },
  pickText: { color: '#2563EB', fontWeight: '600' },
  preview: { width: '100%', height: 220, marginTop: 12, borderRadius: 10, backgroundColor: '#E2E8F0' },
  msg: { color: '#475569', marginTop: 10 },
  submit: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  adminBtn: { marginTop: 28, borderWidth: 1, borderColor: '#0F172A', borderRadius: 12, padding: 14, alignItems: 'center' },
  adminText: { color: '#0F172A', fontWeight: '600' },
});
