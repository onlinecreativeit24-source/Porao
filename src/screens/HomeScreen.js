import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/firebase';

const FILTERS = [
  { id: 'all', label: 'সব' },
  { id: 'tuition', label: 'টিউশন' },
  { id: 'book', label: 'বই' },
  { id: 'saved', label: '🔖 সেভড' },
];

const AVATAR_COLORS = [
  { bg: '#CECBF6', fg: '#3C3489' },
  { bg: '#9FE1CB', fg: '#085041' },
  { bg: '#F5C4B3', fg: '#712B13' },
  { bg: '#B5D4F4', fg: '#0C447C' },
  { bg: '#FAC775', fg: '#633806' },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState('');
  const [shown, setShown] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [savedIds, setSavedIds] = useState(new Set());

  // সব পোস্ট
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setError('পোস্ট লোড হয়নি: ' + e.message)
    );
  }, []);

  // সেরা শিক্ষক: Firestore-এর 'tutors' কালেকশন (name, subject, rating)
  useEffect(() => {
    const q = query(collection(db, 'tutors'), orderBy('rating', 'desc'), limit(5));
    return onSnapshot(
      q,
      (snap) => setTutors(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setTutors([])
    );
  }, []);

  // ইউজারের সেভড পোস্ট: users/{uid}/savedPosts/{postId}
  useEffect(() => {
    if (!user?.uid) {
      setSavedIds(new Set());
      return;
    }
    const q = collection(db, 'users', user.uid, 'savedPosts');
    return onSnapshot(
      q,
      (snap) => setSavedIds(new Set(snap.docs.map((d) => d.id))),
      () => setSavedIds(new Set())
    );
  }, [user?.uid]);

  const toggleSave = async (postId) => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid, 'savedPosts', postId);
    try {
      if (savedIds.has(postId)) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { postId, savedAt: serverTimestamp() });
      }
    } catch (e) {
      setError('সেভ করা যায়নি: ' + e.message);
    }
  };

  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter === 'book' && p.type !== 'book') return false;
      if (filter === 'tuition' && p.type === 'book') return false;
      if (filter === 'saved' && !savedIds.has(p.id)) return false;
      if (!term) return true;
      const hay = [p.title, p.area, p.district, p.details].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [posts, search, filter, savedIds]);

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.logo}>পড়াও</Text>
        <View style={s.headerRight}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <TouchableOpacity style={s.logout} onPress={logout}>
            <Text style={s.logoutText}>লগআউট</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text style={s.welcome}>স্বাগতম, {user?.name || 'ব্যবহারকারী'}</Text>

        <TextInput
          style={s.search}
          placeholder="বিষয়, এলাকা বা জেলা খুঁজুন"
          placeholderTextColor="#8794A3"
          value={search}
          onChangeText={setSearch}
        />

        <View style={s.hero}>
          <Text style={s.heroSmall}>ডিজিটাল লার্নিং প্ল্যাটফর্ম</Text>
          <Text style={s.heroTitle}>আপনার এলাকার সেরা শিক্ষক খুঁজুন</Text>
          <TouchableOpacity style={s.heroBtn} onPress={() => setFilter('tuition')}>
            <Text style={s.heroBtnText}>টিউশন দেখুন</Text>
          </TouchableOpacity>
        </View>

        <View style={s.chips}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[s.chip, filter === f.id && s.chipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[s.chipText, filter === f.id && { color: '#FFF' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.banner} onPress={() => navigation.navigate('Referral')}>
          <View style={{ flex: 1 }}>
            <Text style={s.bTitle}>বন্ধুকে রেফার করুন</Text>
            <Text style={s.bSub}>সর্বোচ্চ ৳৫০০ পর্যন্ত কোর্স ছাড় পান!</Text>
          </View>
          <View style={s.bBtn}>
            <Text style={s.bBtnText}>আয় করুন</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.newPost} onPress={() => navigation.navigate('CreatePost')}>
          <Text style={s.newPostText}>+ নতুন পোস্ট (টিউশন / বই)</Text>
        </TouchableOpacity>

        {tutors.length > 0 && (
          <>
            <Text style={s.section}>সেরা শিক্ষক</Text>
            {tutors.map((t, i) => {
              const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <View key={t.id} style={s.tutorCard}>
                  <View style={[s.tutorAvatar, { backgroundColor: c.bg }]}>
                    <Text style={[s.tutorAvatarText, { color: c.fg }]}>{(t.name || '?').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.tutorName}>{t.name}</Text>
                    {!!t.subject && <Text style={s.tutorSubject}>{t.subject}</Text>}
                  </View>
                  {typeof t.rating === 'number' && (
                    <View style={s.rating}>
                      <Text style={s.ratingText}>★ {t.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <Text style={s.section}>
          {filter === 'saved' ? 'আপনার সেভড পোস্ট' : 'সাম্প্রতিক পোস্ট'}
        </Text>
        {!!error && <Text style={{ color: '#DC2626' }}>{error}</Text>}
        {visiblePosts.length === 0 && !error && (
          <Text style={s.empty}>
            {filter === 'saved'
              ? 'এখনো কোনো পোস্ট সেভ করেননি'
              : posts.length === 0
              ? 'এখনো কোনো পোস্ট নেই'
              : 'কোনো পোস্ট মেলেনি'}
          </Text>
        )}

        {visiblePosts.map((p) => {
          const isSaved = savedIds.has(p.id);
          return (
            <View key={p.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.tagPill, p.type === 'book' ? s.tagBook : s.tagTuition]}>
                  <Text style={[s.tag, { color: p.type === 'book' ? '#854F0B' : '#185FA5' }]}>
                    {p.type === 'book' ? 'বই' : 'টিউশন'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.saveBtn}
                  onPress={() => toggleSave(p.id)}
                  disabled={!user?.uid}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[s.saveIcon, isSaved && s.saveIconActive]}>
                    {isSaved ? '🔖' : '🔗'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={s.cTitle}>{p.title}</Text>
              <Text style={s.cSub}>
                এলাকা: {p.area}
                {p.area && p.district ? ', ' : ''}
                {p.district}
              </Text>
              <Text style={s.cSub}>
                বেতন: ৳{p.salary}  •  সপ্তাহে {p.days} দিন  •  {p.medium}
              </Text>
              {!!p.details && <Text style={s.cDetails}>{p.details}</Text>}
              {shown[p.id] ? (
                <TouchableOpacity onPress={() => Linking.openURL('tel:' + p.phone)}>
                  <Text style={s.phone}>{p.phone}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.contact} onPress={() => setShown((x) => ({ ...x, [p.id]: true }))}>
                  <Text style={s.contactText}>যোগাযোগ করুন</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderColor: '#D6DEE8',
  },
  logo: { fontSize: 22, fontWeight: '700', color: '#1F5F8B' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1F5F8B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700' },
  logout: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },

  welcome: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  search: {
    backgroundColor: '#FFF',
    borderWidth: 0.5,
    borderColor: '#D6DEE8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A2B3C',
    outlineStyle: 'none',
  },

  hero: { backgroundColor: '#1F5F8B', borderRadius: 18, padding: 18, marginTop: 12 },
  heroSmall: { color: '#BFD8EC', fontSize: 11 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', lineHeight: 26, marginTop: 4, marginBottom: 12 },
  heroBtn: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 7 },
  heroBtnText: { color: '#1F5F8B', fontSize: 13, fontWeight: '600' },

  chips: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 0.5, borderColor: '#C9D3DF' },
  chipActive: { backgroundColor: '#1F5F8B', borderColor: '#1F5F8B' },
  chipText: { fontSize: 13, color: '#1A2B3C' },

  banner: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  bTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  bSub: { color: '#DBEAFE', fontSize: 12, marginTop: 4 },
  bBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  newPost: { backgroundColor: '#E5A823', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  newPostText: { fontWeight: '700', color: '#1E293B', fontSize: 15 },

  section: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 20, marginBottom: 10 },
  empty: { color: '#64748B', fontSize: 13 },

  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E1E8F0',
    padding: 12,
    marginBottom: 8,
  },
  tutorAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tutorAvatarText: { fontSize: 17, fontWeight: '700' },
  tutorName: { fontSize: 14, fontWeight: '600', color: '#1A2B3C' },
  tutorSubject: { fontSize: 12, color: '#6B7A8A', marginTop: 2 },
  rating: { backgroundColor: '#FAEEDA', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { color: '#633806', fontSize: 12, fontWeight: '600' },

  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#E1E8F0', marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  tagBook: { backgroundColor: '#FAEEDA' },
  tagTuition: { backgroundColor: '#E6F1FB' },
  tag: { fontSize: 12, fontWeight: '600' },
  saveBtn: { padding: 4 },
  saveIcon: { fontSize: 18, opacity: 0.35 },
  saveIconActive: { opacity: 1 },
  cTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginVertical: 6 },
  cSub: { fontSize: 13, color: '#475569', marginTop: 2 },
  cDetails: { fontSize: 13, color: '#334155', marginTop: 6 },
  contact: { backgroundColor: '#1F5F8B', padding: 11, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  contactText: { color: '#FFF', fontWeight: '700' },
  phone: { marginTop: 10, fontSize: 16, fontWeight: '700', color: '#16A34A' },
});
