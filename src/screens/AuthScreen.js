import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const ROLES = [
  { id: 'student', label: 'শিক্ষার্থী' },
  { id: 'teacher', label: 'শিক্ষক' },
  { id: 'parent', label: 'অভিভাবক' },
];

const errorText = (code) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'ইমেইল সঠিক নয়। আবার দিন।';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'ইমেইল বা পাসওয়ার্ড ভুল।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google লগইন বাতিল হয়েছে।';
    case 'auth/popup-blocked':
      return 'ব্রাউজার পপআপ আটকে দিয়েছে। পপআপ অনুমতি দিন।';
    case 'auth/unauthorized-domain':
      return 'এই ডোমেইন Firebase-এ অনুমোদিত নয়। Authorized domains-এ যোগ করুন।';
    case 'auth/too-many-requests':
      return 'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগ দেখুন।';
    default:
      return 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।';
  }
};

// কম্পোনেন্টের বাইরে রাখা হয়েছে, নইলে টাইপ করতে করতে কিবোর্ড বন্ধ হয়ে যায়
function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function AuthScreen() {
  const { login, signup, loginWithGoogle, resetPassword } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await fn();
    } catch (e) {
      setError(errorText(e?.code));
    }
    setBusy(false);
  };

  const submit = () => {
    if (mode === 'login') {
      if (!email.trim() || !password) return setError('ইমেইল ও পাসওয়ার্ড দিন।');
      return run(() => login(email.trim(), password));
    }
    if (mode === 'signup') {
      if (!name.trim()) return setError('আপনার পূর্ণ নাম দিন।');
      if (!email.trim()) return setError('ইমেইল দিন।');
      if (password.length < 6) return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।');
      return run(() => signup(name.trim(), email.trim(), password, role, referralCode.trim()));
    }
    if (!email.trim()) return setError('আপনার ইমেইল দিন।');
    return run(async () => {
      await resetPassword(email.trim());
      setInfo('রিসেট লিংক পাঠানো হয়েছে। ইমেইল (স্প্যাম ফোল্ডারসহ) দেখুন।');
    });
  };

  const google = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('শীঘ্রই আসছে', 'মোবাইল অ্যাপে Google লগইনের জন্য আলাদা সেটআপ লাগবে। ওয়েব ভার্সনে এটা কাজ করবে।');
      return;
    }
    run(() => loginWithGoogle(role, referralCode.trim()));
  };

  const title = mode === 'forgot' ? 'পাসওয়ার্ড রিসেট করুন' : 'আপনার অ্যাকাউন্টে ঢুকুন';
  const btnText = mode === 'login' ? 'লগইন করুন' : mode === 'signup' ? 'রেজিস্ট্রেশন করুন' : 'রিসেট লিংক পাঠান';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 36 }} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>প</Text>
          </View>
          <Text style={s.brand}>পড়াও</Text>
          <Text style={s.sub}>{title}</Text>
        </View>

        {mode !== 'forgot' && (
          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, mode === 'login' && s.tabActive]} onPress={() => switchMode('login')}>
              <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>লগইন</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, mode === 'signup' && s.tabActive]} onPress={() => switchMode('signup')}>
              <Text style={[s.tabText, mode === 'signup' && s.tabTextActive]}>সাইন আপ</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'signup' && (
          <Field label="আপনার পরিচয়">
            <View style={s.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[s.roleChip, role === r.id && s.roleChipActive]}
                  onPress={() => setRole(r.id)}
                >
                  <Text style={[s.roleText, role === r.id && { color: '#FFF', fontWeight: '700' }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        )}

        {mode === 'signup' && (
          <Field label="পূর্ণ নাম">
            <TextInput
              style={s.input}
              placeholder="যেমন: রহিম আহমেদ"
              placeholderTextColor="#8794A3"
              value={name}
              onChangeText={setName}
            />
          </Field>
        )}

        <Field label="ইমেইল">
          <TextInput
            style={s.input}
            placeholder="name@example.com"
            placeholderTextColor="#8794A3"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </Field>

        {mode !== 'forgot' && (
          <Field label="পাসওয়ার্ড">
            <View style={s.passWrap}>
              <TextInput
                style={[s.input, s.passInput]}
                placeholder="কমপক্ষে ৬ অক্ষর"
                placeholderTextColor="#8794A3"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingHorizontal: 12 }}>
                <Text style={s.link}>{showPass ? 'লুকান' : 'দেখান'}</Text>
              </TouchableOpacity>
            </View>
          </Field>
        )}

        {mode === 'signup' && (
          <Field label="রেফারেল কোড (ঐচ্ছিক)">
            <TextInput
              style={s.input}
              placeholder="বন্ধুর কোড থাকলে দিন"
              placeholderTextColor="#8794A3"
              autoCapitalize="characters"
              value={referralCode}
              onChangeText={setReferralCode}
            />
          </Field>
        )}

        {mode === 'login' && (
          <TouchableOpacity onPress={() => switchMode('forgot')} style={{ alignSelf: 'flex-end', marginBottom: 12 }}>
            <Text style={s.link}>পাসওয়ার্ড ভুলে গেছেন?</Text>
          </TouchableOpacity>
        )}

        {!!error && <Text style={s.error}>{error}</Text>}
        {!!info && <Text style={s.info}>{info}</Text>}

        <TouchableOpacity style={[s.primaryBtn, busy && { opacity: 0.7 }]} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>{btnText}</Text>}
        </TouchableOpacity>

        {mode === 'forgot' ? (
          <TouchableOpacity onPress={() => switchMode('login')} style={{ alignSelf: 'center', marginTop: 16 }}>
            <Text style={s.link}>লগইনে ফিরে যান</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>অথবা</Text>
              <View style={s.orLine} />
            </View>

            <TouchableOpacity style={s.googleBtn} onPress={google} disabled={busy}>
              <Text style={s.googleG}>G</Text>
              <Text style={s.googleText}>Google দিয়ে {mode === 'login' ? 'লগইন' : 'সাইন আপ'}</Text>
            </TouchableOpacity>

            <View style={s.switchRow}>
              <Text style={{ color: '#6B7A8A' }}>{mode === 'login' ? 'নতুন? ' : 'আগেই অ্যাকাউন্ট আছে? '}</Text>
              <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={[s.link, { fontWeight: '700' }]}>{mode === 'login' ? 'সাইন আপ করুন' : 'লগইন করুন'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },
  logoWrap: { alignItems: 'center', marginBottom: 22 },
  logoBox: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#1F5F8B', alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  brand: { fontSize: 24, fontWeight: '700', color: '#1F5F8B', marginTop: 8 },
  sub: { fontSize: 13, color: '#6B7A8A', marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: '#E6ECF3', borderRadius: 12, padding: 3, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { color: '#6B7A8A', fontSize: 14 },
  tabTextActive: { color: '#1F5F8B', fontWeight: '700' },

  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 0.5, borderColor: '#C9D3DF', backgroundColor: '#FFF' },
  roleChipActive: { backgroundColor: '#1F5F8B', borderColor: '#1F5F8B' },
  roleText: { fontSize: 13, color: '#1A2B3C' },

  label: { fontSize: 13, color: '#4A5A6A', marginBottom: 5 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 0.5,
    borderColor: '#C9D3DF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1A2B3C',
    outlineStyle: 'none',
  },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 0.5, borderColor: '#C9D3DF', borderRadius: 12 },
  passInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },

  link: { color: '#185FA5', fontSize: 13 },
  error: { color: '#A32D2D', fontSize: 13, marginBottom: 10 },
  info: { color: '#0F6E56', fontSize: 13, marginBottom: 10 },

  primaryBtn: { backgroundColor: '#1F5F8B', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  orLine: { flex: 1, height: 0.5, backgroundColor: '#C9D3DF' },
  orText: { color: '#8794A3', fontSize: 12 },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderWidth: 0.5,
    borderColor: '#C9D3DF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  googleG: { fontSize: 17, fontWeight: '800', color: '#D85A30' },
  googleText: { fontSize: 14, fontWeight: '600', color: '#1A2B3C' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
});
