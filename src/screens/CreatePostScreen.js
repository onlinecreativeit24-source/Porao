import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { AuthContext } from '../context/AuthContext';

const bn2en = (s = '') => String(s).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));

export default function CreatePostScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [f, setF] = useState({
    type: 'tuition', title: '', district: '', area: '',
    salary: '', days: '', medium: 'বাসায়', details: '', phone: '',
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setMsg('');
    const phone = bn2en(f.phone).replace(/\D/g, '');
    const salary = Number(bn2en(f.salary).replace(/[^\d.]/g, '')) || 0;
    const days = Number(bn2en(f.days).replace(/\D/g, '')) || 0;
    const title = f.title.trim();
    const details = f.details.trim();

    if (!title) return setMsg('শিরোনাম দিন');
    if (title.length > 80) return setMsg('শিরোনাম ৮০ অক্ষরের বেশি হতে পারবে না');
    if (details.length > 600) return setMsg('বিস্তারিত ৬০০ অক্ষরের বেশি হতে পারবে না');
    if (!/^01\d{9}$/.test(phone)) return setMsg('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন');
    if (!user?.uid) return setMsg('আগে লগইন করুন');

    setBusy(true);
    try {
      await addDoc(collection(db, 'posts'), {
        type: f.type,
        title,
        district: f.district.trim(),
        area: f.area.trim(),
        salary, days,
        medium: f.medium,
        details,
        phone,
        uid: user.uid,
        ownerName: user.name || '',
        createdAt: serverTimestamp(),
      });
      navigation.goBack();
    } catch (e) {
      setMsg('পোস্ট হয়নি: ' + e.message);
    }
    setBusy(false);
  };

  const Chip = ({ k, v, label }) => (
    <TouchableOpacity style={[s.chip, f[k] === v && s.chipOn]} onPress={() => set(k, v)}>
      <Text style={f[k] === v ? s.chipTextOn : s.chipText}>{label || v}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.label}>ধরন</Text>
      <View style={s.row}>
        <Chip k="type" v="tuition" label="টিউশন" />
        <Chip k="type" v="book" label="বই" />
      </View>

      <Text style={s.label}>শিরোনাম ({f.title.length}/80)</Text>
      <TextInput
        style={s.input}
        value={f.title}
        maxLength={80}
        onChangeText={t => set('title', t)}
        placeholder="যেমন: ক্লাস ৯ এর জন্য টিউটর চাই"
      />

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>জেলা</Text>
          <TextInput style={s.input} value={f.district} onChangeText={t => set('district', t)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>এলাকা</Text>
          <TextInput style={s.input} value={f.area} onChangeText={t => set('area', t)} />
        </View>
      </View>

      <Text style={s.label}>বেতন / মূল্য</Text>
      <TextInput style={s.input} value={f.salary} onChangeText={t => set('salary', t)} keyboardType="numeric" />

      <Text style={s.label}>সপ্তাহে কত দিন</Text>
      <TextInput style={s.input} value={f.days} onChangeText={t => set('days', t)} keyboardType="numeric" />

      <Text style={s.label}>মাধ্যম</Text>
      <View style={s.row}>
        <Chip k="medium" v="বাসায়" />
        <Chip k="medium" v="অনলাইনে" />
        <Chip k="medium" v="টিচারের বাসায়" />
      </View>

      <Text style={s.label}>বিস্তারিত ({f.details.length}/600)</Text>
      <TextInput
        style={[s.input, { height: 100 }]}
        multiline
        maxLength={600}
        value={f.details}
        onChangeText={t => set('details', t)}
      />

      <Text style={s.label}>যোগাযোগের মোবাইল নম্বর</Text>
      <TextInput style={s.input} value={f.phone} onChangeText={t => set('phone', t)} keyboardType="phone-pad" />
      <Text style={s.hint}>নম্বরটি সবার সামনে দেখানো হয় না। লগইন করা ব্যবহারকারী যোগাযোগ বাটনে চাপ দিলে দেখতে পায়।</Text>

      {!!msg && <Text style={s.err}>{msg}</Text>}
      <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
        <Text style={s.btnText}>{busy ? 'অপেক্ষা করুন...' : 'পোস্ট করুন'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, backgroundColor: '#F4F7FC' },
  label: { fontWeight: '700', color: '#1E293B', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, fontSize: 15, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF' },
  chipOn: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#334155' }, chipTextOn: { color: '#FFF', fontWeight: '700' },
  hint: { color: '#64748B', fontSize: 12, marginTop: 6 },
  err: { color: '#DC2626', marginTop: 10 },
  btn: { backgroundColor: '#E5A823', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 16, marginBottom: 30 },
  btnText: { fontWeight: '800', fontSize: 16, color: '#1E293B' },
});
