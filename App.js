import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tuition'); // 'tuition', 'books'

  // পোস্টের ডাটা ও মোডাল স্টেট
  const [tuitionPosts, setTuitionPosts] = useState([]);
  const [bookPosts, setBookPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // নতুন পোস্ট ফর্ম স্টেট
  const [postTitle, setPostTitle] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postDetails, setPostDetails] = useState('');
  const [postType, setPostType] = useState('tuition'); // 'tuition' or 'book'

  // ১. ফায়ারস্টোর থেকে রিয়েল-টাইম ডাটা ফেচ করা
  useEffect(() => {
    if (!userData) return;

    // টিউশন পোস্ট লোড
    const qTuition = query(collection(db, "tuition_posts"), orderBy("createdAt", "desc"));
    const unsubscribeTuition = onSnapshot(qTuition, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTuitionPosts(posts);
    });

    // বইয়ের পোস্ট লোড
    const qBooks = query(collection(db, "book_posts"), orderBy("createdAt", "desc"));
    const unsubscribeBooks = onSnapshot(qBooks, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookPosts(posts);
    });

    return () => {
      unsubscribeTuition();
      unsubscribeBooks();
    };
  }, [userData]);

  // ২. নতুন পোস্ট ফায়ারস্টোরে সেভ করার ফাংশন
  const handleCreatePost = async () => {
    if (!postTitle || !postLocation || !postPrice) {
      Alert.alert("ভুল!", "শিরোনাম, লোকেশন এবং বাজেট প্রদান করুন");
      return;
    }

    try {
      const collectionName = postType === 'tuition' ? "tuition_posts" : "book_posts";
      await addDoc(collection(db, collectionName), {
        title: postTitle,
        location: postLocation,
        price: postPrice,
        details: postDetails,
        userName: userData.name,
        userEmail: userData.email,
        createdAt: new Date().toISOString()
      });

      Alert.alert("সফল!", "আপনার পোস্টটি সফলভাবে তৈরি হয়েছে।");
      setModalVisible(false);
      // ফর্ম রিসেট
      setPostTitle('');
      setPostLocation('');
      setPostPrice('');
      setPostDetails('');
    } catch (err) {
      Alert.alert("এরর", err.message);
    }
  };

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
            <Text style={styles.welcomeUser}>হ্যালো, {userData.name} ({userData.role === 'tutor' ? 'টিউটর' : 'শিক্ষার্থী'})</Text>
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
        </View>

        {/* Create Post FAB Button */}
        <TouchableOpacity style={styles.fabBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabBtnText}>+ নতুন পোস্ট</Text>
        </TouchableOpacity>

        {/* Dynamic Content List */}
        <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'tuition' && (
            <View>
              <Text style={styles.sectionTitle}>সর্বশেষ টিউশন পোস্টসমূহ ({tuitionPosts.length})</Text>
              {tuitionPosts.length === 0 ? (
                <Text style={styles.emptyText}>কোনো টিউশন পোস্ট পাওয়া যায়নি। নতুন পোস্ট করুন!</Text>
              ) : (
                tuitionPosts.map((item) => (
                  <View key={item.id} style={styles.postCard}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postSub}>📍 {item.location} • 👤 {item.userName}</Text>
                    {item.details ? <Text style={styles.postDetails}>{item.details}</Text> : null}
                    <View style={styles.cardFooter}>
                      <Text style={styles.salaryText}>{item.price}</Text>
                      <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>বিড করুন (Bid)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'books' && (
            <View>
              <Text style={styles.sectionTitle}>বিনিময় বা কম দামে বই ({bookPosts.length})</Text>
              {bookPosts.length === 0 ? (
                <Text style={styles.emptyText}>কোনো বইয়ের পোস্ট পাওয়া যায়নি।</Text>
              ) : (
                bookPosts.map((item) => (
                  <View key={item.id} style={styles.postCard}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text style={styles.postSub}>📍 {item.location} • 👤 {item.userName}</Text>
                    {item.details ? <Text style={styles.postDetails}>{item.details}</Text> : null}
                    <View style={styles.cardFooter}>
                      <Text style={styles.priceText}>{item.price}</Text>
                      <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]}>
                        <Text style={styles.actionBtnText}>রিকোয়েস্ট দিন</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Modal for Creating New Post */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>নতুন পোস্ট করুন</Text>

              {/* Type Switcher */}
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[styles.roleChip, postType === 'tuition' && styles.activeRoleChip]} 
                  onPress={() => setPostType('tuition')}>
                  <Text style={postType === 'tuition' ? styles.activeRoleText : styles.roleText}>📢 টিউশন পোস্ট</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleChip, postType === 'book' && styles.activeRoleChip]} 
                  onPress={() => setPostType('book')}>
                  <Text style={postType === 'book' ? styles.activeRoleText : styles.roleText}>📚 বই বিনিময়</Text>
                </TouchableOpacity>
              </View>

              <TextInput 
                style={styles.input} 
                placeholder={postType === 'tuition' ? "বিষয়/ক্লাস (যেমন: ৯ম শ্রেণী গণিত)" : "বইয়ের নাম"} 
                value={postTitle} 
                onChangeText={setPostTitle} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="এলাকা/লোকেশন (যেমন: চকবাজার, চট্টগ্রাম)" 
                value={postLocation} 
                onChangeText={setPostLocation} 
              />
              <TextInput 
                style={styles.input} 
                placeholder={postType === 'tuition' ? "বাজেট (যেমন: ৫,০০০ টাকা/মাস)" : "মূল্য (যেমন: ২০০ টাকা / বিনিময়)"} 
                value={postPrice} 
                onChangeText={setPostPrice} 
              />
              <TextInput 
                style={[styles.input, {height: 60}]} 
                placeholder="বিস্তারিত বিবরণ (ঐচ্ছিক)" 
                value={postDetails} 
                onChangeText={setPostDetails} 
                multiline 
              />

              <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                <TouchableOpacity style={[styles.submitBtn, {flex: 1, backgroundColor: '#64748B'}]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.submitBtnText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, {flex: 1}]} onPress={handleCreatePost}>
                  <Text style={styles.submitBtnText}>পোস্ট করুন</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

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
  
  // Dashboard & Modal Styles
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  dashLogo: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  welcomeUser: { fontSize: 13, color: '#64748B' },
  logoutSmallBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutSmallText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  featureTabNav: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 10, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  featureTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeFeatureTab: { borderBottomWidth: 3, borderColor: '#2563EB' },
  featureText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  activeFeatureText: { color: '#2563EB', fontWeight: '700', fontSize: 14 },
  feedContainer: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontSize: 14 },
  postCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  postTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  postSub: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  postDetails: { fontSize: 13, color: '#334155', marginBottom: 10, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  salaryText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  priceText: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  actionBtn: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  fabBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 5, zIndex: 99 },
  fabBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#1E293B' },
});
