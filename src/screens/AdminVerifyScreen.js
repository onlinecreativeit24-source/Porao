import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import {
  collection, query, where, limit, getDocs, doc, updateDoc,
  setDoc, deleteField, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const DOCT = {
  nid: 'জাতীয় পরিচয়পত্র (NID)',
  passport: 'পাসপোর্ট',
  student: 'শিক্ষা প্রতিষ্ঠানের আইডি কার্ড',
};
const ROLE = { student: 'শিক্ষার্থী', teacher: 'শিক্ষক', parent: 'অভিভাবক' };

export default function AdminVerifyScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectFor, setRejectFor] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'verifications'), where('status', '==', 'pending'), limit(30));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError('লোড হয়নি: ' + (e.code || e.message));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (uid) => {
    try {
      await updateDoc(doc(db, 'verifications', uid), { status: 'approved', reviewedAt: serverTimestamp() });
      // ফিডে ব্যাজ দেখানোর সর্বজনীন তালিকা (ওয়েবের mod8.js যেটা পড়ে)
      try { await setDoc(doc(db, 'settings', 'verifiedUsers'), { [uid]: true }, { merge: true }); } catch (e) {}
      setItems((p) => p.filter((x) => x.id !== uid));
    } catch (e) {
      Alert.alert('সমস্যা হয়েছে', e.code || e.message);
    }
  };

  const reject = async () => {
    const uid = rejectFor;
    try {
      await updateDoc(doc(db, 'verifications', uid), {
        status: 'rejected', note: note.slice(0, 200), reviewedAt: serverTimestamp(),
      });
      try { await setDoc(doc(db, 'settings', 'verifiedUsers'), { [uid]: deleteField() }, { merge: true }); } catch (e) {}
      setItems((p) => p.filter((x) => x.id !== uid));
    } catch (e) {
      Alert.alert('সমস্যা হয়েছে', e.code || e.message);
    }
    setRejectFor(null);
    setNote('');
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={s.container}>
      {!!error && <Text style={s.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={!error && <Text style={s.empty}>পেন্ডিং ভেরিফিকেশন নেই।</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.name || '?'} <Text style={s.role}>({ROLE[item.role] || item.role})</Text></Text>
            <Text style={s.type}>{DOCT[item.docType] || item.docType}</Text>
            <Image source={{ uri: item.image }} style={s.img} resizeMode="contain" />
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.approve]} onPress={() => approve(item.id)}>
                <Text style={s.btnText}>অনুমোদন</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.reject]} onPress={() => setRejectFor(item.id)}>
                <Text style={s.btnText}>বাতিল</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={!!rejectFor} transparent animationType="fade" onRequestClose={() => setRejectFor(null)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.name}>বাতিলের কারণ (ঐচ্ছিক)</Text>
            <TextInput style={s.input} value={note} onChangeText={setNote} placeholder="যেমন: ছবি স্পষ্ট নয়" multiline />
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#E2E8F0' }]} onPress={() => { setRejectFor(null); setNote(''); }}>
                <Text style={[s.btnText, { color: '#0F172A' }]}>ফিরে যান</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.reject]} onPress={reject}>
                <Text style={s.btnText}>বাতিল করুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 40 },
  error: { color: '#991B1B', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  name: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  role: { fontWeight: '400', color: '#64748B' },
  type: { color: '#475569', marginTop: 2 },
  img: { width: '100%', height: 240, marginTop: 10, borderRadius: 8, backgroundColor: '#E2E8F0' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  approve: { backgroundColor: '#16A34A' },
  reject: { backgroundColor: '#DC2626' },
  btnText: { color: '#FFF', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, marginTop: 10, minHeight: 60 },
});
