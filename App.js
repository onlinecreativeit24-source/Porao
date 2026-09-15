import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail // পাসওয়ার্ড রিসেটের জন্য নতুন ইমপোর্ট
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
  const [resetSent, setResetSent] = useState(false); // রিসেট মেসেজ দেখানোর জন্য স্টেট

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

  // পাসওয়ার্ড রিকভারি ফাংশন
  const handlePasswordReset = async () => {
    setError('');
    setResetSent(false);
    
    if (!email) {
      setError('পাসওয়ার্ড রিসেট করতে আগে ইমেইল বক্সে আপনার ইমেইলটি লিখুন।');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      Alert.alert(
        "ইমেইল পাঠানো হয়েছে!",
        "পাসওয়ার্ড রিসেট করার লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করুন।"
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = () => {
    alert("Google Auth SDK প্রস্তুত হচ্ছে। আপাতত ইমেইল/পাসওয়ার্ড দিয়ে টেস্ট করুন!");
  };

  if (userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileCard}>
          <Text style={styles.welcomeTitle}>🎉 স্বাগতম Porao-তে!</Text>
          <View style={styles.avatarPlaceholder}>
             <Text style={{fontSize: 40}}>👤</Text>
          </View>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileEmail}>{userData.email}</Text>
          <View style={styles.badge}>
             <Text style={styles.badgeText}>{userData.role === 'tutor' ? '👨‍🏫 টিউটর' : '🎓 শিক্ষার্থী'}</Text>
          </View>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setUserData(null)}>
            <Text style={styles.logoutBtnText}>লগআউট করুন</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              onPress={() => { setIsLogin(false); setError(''); setResetSent(false); }}>
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>সাইন আপ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, isLogin && styles.activeTab]} 
              onPress={() => { setIsLogin(true); setError(''); setResetSent(false); }}>
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>লগইন</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {resetSent ? <Text style={styles.successText}>রিসেট ইমেইল পাঠানো হয়েছে! ইনবক্স চেক করুন।</Text> : null}

          {!isLogin && (
            <>
              <Text style={styles.label}>পুরো নাম</Text>
              <TextInput
                style={styles.input}
                placeholder="যেমন: তানভীর আহমেদ"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>আপনি কি হিসেবে যুক্ত হতে চান?</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[styles.roleChip, role === 'student' && styles.activeRoleChip]} 
                  onPress={() => setRole('student')}>
                  <Text style={role === 'student' ? styles.activeRoleText : styles.roleText}>🎓 শিক্ষার্থী</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleChip, role === 'tutor' && styles.activeRoleChip]} 
                  onPress={() => setRole('tutor')}>
                  <Text style={role === 'tutor' ? styles.activeRoleText : styles.roleText}>👨‍🏫 টিউটর</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.label}>ইমেইল এড্রেস</Text>
          <TextInput
            style={styles.input}
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>পাসওয়ার্ড</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forget Password Option (Only visible in Login mode) */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handlePasswordReset}>
              <Text style={styles.forgotBtnText}>পাসওয়ার্ড ভুলে গেছেন?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>{isLogin ? 'লগইন করুন' : 'একাউন্ট খুলুন'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>অথবা</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
            <Text style={styles.googleIcon}>🌐</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  scrollContainer: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 14,
    color: '#0F172A',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  activeRoleChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleText: {
    color: '#64748B',
    fontWeight: '600',
  },
  activeRoleText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#94A3B8',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  googleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
  },
});
