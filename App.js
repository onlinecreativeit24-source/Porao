import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, Alert, FlatList 
} from 'react-native';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tuition'); // 'tuition', 'books', 'tutors'

  // ডামি ডাটা - হোম পেজ টেস্ট করার জন্য
  const tuitionPosts = [
    { id: '1', title: 'ক্লাস ৯-১০ পদার্থবিজ্ঞান টিউটর চাই', location: 'জিইসি মোড়, চট্টগ্রাম', salary: '৳ ৫,০০০/মাস', days: 'সপ্তাহে ৩ দিন' },
    { id: '2', title: 'HSC ২য় বর্ষ উচ্চতর গণিত', location: 'আগ্রাবাদ, চট্টগ্রাম', salary: '৳ ৬,০০০/মাস', days: 'সপ্তাহে ৪ দিন' },
  ];

  const bookPosts = [
    { id: '1', title: 'HSC পদার্থবিজ্ঞান ১ম পত্র (ইসহাক স্যার)', condition: 'ভালো', price: 'বিনামূল্যে / বিনিময়', location: 'চকবাজার' },
    { id: '2', title: 'Class 10 English Grammar Guide', condition: 'মোটামুটি', price: '৳ ১৫০', location: 'হালিশহর' },
  ];

  const topTutors = [
    { id: '1', name: 'মোঃ সাব্বির হোসেন', varsity: 'চুয়েট (CSE)', subject: 'গণিত ও পদার্থবিজ্ঞান', verified: true },
    { id: '2', name: 'আনিকা তাহসিন', varsity: 'চট্টগ্রাম বিশ্ববিদ্যালয় (English)', subject: 'ইংরেজি ও বাংলা', verified: true },
  ];

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('ইমেইল ও পাসওয়ার্ড প্রদান করুন');
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData({ email: user.email, name: 'ব্যবহারকারী', role: 'student' });
        }
      } else {
        if (!name) {
          setError('আপনার পুরো নাম লিখুন');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newUserData = {
          uid: user.uid,
          name: name,
          email: email,
          role: role,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", user.uid), newUserData);
        setUserData(newUserData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('পাসওয়ার্ড রিসেট করতে আগে ইমেইলটি লিখুন।');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("ইমেইল পাঠানো হয়েছে!", "পাসওয়ার্ড রিসেট লিংক ইমেইলে চেক করুন।");
    } catch (err) {
      setError(err.message);
    }
  };

  // হোম ড্যাশবোর্ড স্ক্রিন
  if (userData) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.dashLogo}>📚 Porao</Text>
            <Text style={styles.welcomeUser}>হ্যালো, {userData.name} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutSmallBtn} onPress={() => setUserData(null)}>
            <Text style={styles.logoutSmallText}>লগআউট</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Tabs */}
        <View style={styles.featureTabNav}>
          <TouchableOpacity 
            style={[styles.featureTab, activeTab === 'tuition' && styles.activeFeatureTab]}
            onPress={() => setActiveTab('tuition')}>
            <Text style={activeTab === 'tuition' ? styles.activeFeatureText : styles.featureText}>📢 টিউশন</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.featureTab, activeTab === 'books' && styles.activeFeatureTab]}
            onPress={() => setActiveTab('books')}>
            <Text style={activeTab === 'books' ? styles.activeFeatureText : styles.featureText}>📚 বই শেয়ার</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.featureTab, activeTab === 'tutors' && styles.activeFeatureTab]}
            onPress={() => setActiveTab('tutors')}>
            <Text style={activeTab === 'tutors' ? styles.activeFeatureText : styles.featureText}>👨‍🏫 টিউটরগণ</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Content List */}
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'tuition' && (
            <View>
              <Text style={styles.sectionTitle}>সর্বশেষ টিউশন পোস্টসমূহ</Text>
              {tuitionPosts.map((item) => (
                <View key={item.id} style={styles.postCard}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postSub}>📍 {item.location} • 📅 {item.days}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.salaryText}>{item.salary}</Text>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>বিড করুন (Bid)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'books' && (
            <View>
              <Text style={styles.sectionTitle}>বিনিময় বা কম দামে বই</Text>
              {bookPosts.map((item) => (
                <View key={item.id} style={styles.postCard}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postSub}>অবস্থা: {item.condition} • 📍 {item.location}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>{item.price}</Text>
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]}>
                      <Text style={styles.actionBtnText}>রিকোয়েস্ট দিন</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'tutors' && (
            <View>
              <Text style={styles.sectionTitle}>সেরা ভেরিফাইড টিউটরবৃন্দ</Text>
              {topTutors.map((item) => (
                <View key={item.id} style={styles.postCard}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.postTitle}>{item.name} </Text>
                    {item.verified && <Text style={{color: '#2563EB', fontWeight: 'bold'}}>☑️ Verified</Text>}
                  </View>
                  <Text style={styles.postSub}>🎓 {item.varsity}</Text>
                  <Text style={styles.postSub}>📖 বিষয়: {item.subject}</Text>
                  <TouchableOpacity style={[styles.actionBtn, {marginTop: 10, alignSelf: 'flex-start'}]}>
                    <Text style={styles.actionBtnText}>প্রোফাইল দেখুন</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // সাইন-আপ / লগইন স্ক্রিন
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.logoText}>📚 Porao</Text>
          <Text style={styles.tagline}>টিউশন খুঁজুন ও বই বিনিময় করুন সহজে</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, !isLogin && styles.activeTab]} 
              onPress={() => { setIsLogin(false); setError(''); }}>
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>সাইন আপ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, isLogin && styles.activeTab]} 
              onPress={() => { setIsLogin(true); setError(''); }}>
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>লগইন</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isLogin && (
            <>
              <Text style={styles.label}>পুরো নাম</Text>
              <TextInput style={styles.input} placeholder="যেমন: তানভীর আহমেদ" value={name} onChangeText={setName} />
              <Text style={styles.label}>আপনি কি হিসেবে যুক্ত হতে চান?</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity style={[styles.roleChip, role === 'student' && styles.activeRoleChip]} onPress={() => setRole('student')}>
                  <Text style={role === 'student' ? styles.activeRoleText : styles.roleText}>🎓 শিক্ষার্থী</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleChip, role === 'tutor' && styles.activeRoleChip]} onPress={() => setRole('tutor')}>
                  <Text style={role === 'tutor' ? styles.activeRoleText : styles.roleText}>👨‍🏫 টিউটর</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.label}>ইমেইল এড্রেস</Text>
          <TextInput style={styles.input} placeholder="example@mail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>পাসওয়ার্ড</Text>
          <TextInput style={styles.input} placeholder="******" value={password} onChangeText={setPassword} secureTextEntry />

          {isLogin && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handlePasswordReset}>
              <Text style={styles.forgotBtnText}>পাসওয়ার্ড ভুলে গেছেন?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isLogin ? 'লগইন করুন' : 'একাউন্ট খুলুন'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  scrollContainer: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  logoText: { fontSize: 36, fontWeight: '800', color: '#1E293B' },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#2563EB' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 14 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotBtnText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleChip: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, alignItems: 'center' },
  activeRoleChip: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  roleText: { color: '#64748B', fontWeight: '600' },
  activeRoleText: { color: '#2563EB', fontWeight: '700' },
  submitBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  
  // Dashboard Styles
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  dashLogo: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  welcomeUser: { fontSize: 14, color: '#64748B' },
  logoutSmallBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutSmallText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  featureTabNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  featureTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeFeatureTab: { borderBottomWidth: 3, borderColor: '#2563EB' },
  featureText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  activeFeatureText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  feedContainer: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  postCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  postTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  postSub: { fontSize: 13, color: '#64748B', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  salaryText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  priceText: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  actionBtn: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
});
