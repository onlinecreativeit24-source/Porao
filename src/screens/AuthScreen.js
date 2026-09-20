
import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, signup, loginWithGoogle, resetPassword } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setMsg(''); setBusy(true);
    try { await fn(); } catch (e) { setMsg(e.message.replace('Firebase: ', '')); }
    setBusy(false);
  };

  const submit = () => {
    if (mode === 'login') return run(() => login(email.trim(), pass));
    if (mode === 'signup') return run(() => signup(name.trim(), email.trim(), pass));
    return run(async () => { await resetPassword(email.trim()); setMsg('রিসেট লিংক ইমেইলে পাঠানো হয়েছে'); });
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.logo}>📚 Porao</Text>
      <Text style={s.title}>
        {mode === 'login' ? 'লগইন করুন' : mode === 'signup' ? 'নতুন অ্যাকাউন্ট' : 'পাসওয়ার্ড রিসেট'}
      </Text>

      {mode === 'signup' && (
        <TextInput style={s.input} placeholder="আপনার নাম" value={name} onChangeText={setName} />
      )}
      <TextInput style={s.input} placeholder="ইমেইল" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      {mode !== 'reset' && (
        <TextInput style={s.input} placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" secureTextEntry
          value={pass} onChangeText={setPass} />
      )}

      {!!msg && <Text style={s.msg}>{msg}</Text>}

      <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
        <Text style={s.btnText}>
          {busy ? '...' : mode === 'login' ? 'লগইন' : mode === 'signup' ? 'সাইন আপ' : 'লিংক পাঠান'}
        </Text>
      </TouchableOpacity>

      {mode !== 'reset' && (
        <TouchableOpacity style={s.gBtn} onPress={() => run(loginWithGoogle)}>
          <Text style={s.gText}>G  Google দিয়ে চালিয়ে যান</Text>
        </TouchableOpacity>
      )}

      {mode === 'login' && (
        <>
          <TouchableOpacity onPress={() => setMode('reset')}><Text style={s.link}>পাসওয়ার্ড ভুলে গেছেন?</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('signup')}><Text style={s.link}>নতুন? সাইন আপ করুন</Text></TouchableOpacity>
        </>
      )}
      {mode !== 'login' && (
        <TouchableOpacity onPress={() => setMode('login')}><Text style={s.link}>← লগইনে ফিরুন</Text></TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F4F7FC' },
  logo: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#1E293B' },
  title: { fontSize: 18, textAlign: 'center', marginVertical: 16, color: '#334155' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  gBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  gText: { fontWeight: '600', color: '#1E293B', fontSize: 15 },
  link: { color: '#2563EB', textAlign: 'center', marginTop: 14, fontSize: 14 },
  msg: { color: '#DC2626', marginBottom: 8, textAlign: 'center' },
});
