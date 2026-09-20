import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/firebase';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [shown, setShown] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q,
      snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      e => setError('পোস্ট লোড হয়নি: ' + e.message)
    );
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.logo}>📚 Porao</Text>
          <Text style={s.welcome}>স্বাগতম, {user?.name || 'ব্যবহারকারী'} 👋</Text>
        </View>
        <TouchableOpacity style={s.logout} onPress={logout}>
          <Text style={s.logoutText}>লগআউট</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity style={s.banner} onPress={() => navigation.navigate('Referral')}>
          <View style={{ flex: 1 }}>
            <Text style={s.bTitle}>🎁 বন্ধুকে রেফার করুন</Text>
            <Text style={s.bSub}>সর্বোচ্চ ৳৫০০ পর্যন্ত কোর্স ছাড় পান!</Text>
          </View>
          <View style={s.bBtn}><Text style={s.bBtnText}>আয় করুন ➔</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={s.newPost} onPress={() => navigation.navigate('CreatePost')}>
          <Text style={s.newPostText}>➕ নতুন পোস্ট (টিউশন / বই)</Text>
        </TouchableOpacity>

        <Text style={s.section}>সাম্প্রতিক পোস্ট</Text>
        {!!error && <Text style={{ color: '#DC2626' }}>{error}</Text>}
        {posts.length === 0 && !error && <Text style={{ color: '#64748B' }}>এখনো কোনো পোস্ট নেই</Text>}

        {posts.map(p => (
          <View key={p.id} style={s.card}>
            <Text style={s.tag}>{p.type === 'book' ? '📖 বই' : '🎓 টিউশন'}</Text>
            <Text style={s.cTitle}>{p.title}</Text>
            <Text style={s.cSub}>📍 {p.area}{p.area && p.district ? ', ' : ''}{p.district}</Text>
            <Text style={s.cSub}>💰 ৳{p.salary}  •  📅 সপ্তাহে {p.days} দিন  •  🏠 {p.medium}</Text>
            {!!p.details && <Text style={s.cDetails}>{p.details}</Text>}
            {shown[p.id] ? (
              <TouchableOpacity onPress={() => Linking.openURL('tel:' + p.phone)}>
                <Text style={s.phone}>📞 {p.phone}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.contact} onPress={() => setShown(x => ({ ...x, [p.id]: true }))}>
                <Text style={s.contactText}>যোগাযোগ করুন</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  logo: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  welcome: { fontSize: 13, color: '#64748B', marginTop: 2 },
  logout: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  banner: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  bTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  bSub: { color: '#DBEAFE', fontSize: 12, marginTop: 4 },
  bBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  newPost: { backgroundColor: '#E5A823', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 18 },
  newPostText: { fontWeight: '800', color: '#1E293B', fontSize: 15 },
  section: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  tag: { fontSize: 12, color: '#2563EB', fontWeight: '700' },
  cTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginVertical: 4 },
  cSub: { fontSize: 13, color: '#475569', marginTop: 2 },
  cDetails: { fontSize: 13, color: '#334155', marginTop: 6 },
  contact: { backgroundColor: '#2563EB', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  contactText: { color: '#FFF', fontWeight: '700' },
  phone: { marginTop: 10, fontSize: 16, fontWeight: '700', color: '#16A34A' },
});
