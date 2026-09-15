import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // 'student' অথবা 'tutor'
  const [isLogin, setIsLogin] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    try {
      if (isLogin) {
        // লগইন
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Firestore থেকে ইউজার প্রোফাইল সংগ্রহ
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData({ email: user.email, name: 'ব্যবহারকারী', role: 'নট সেট' });
        }
      } else {
        // সাইন-আপ
        if (!name) {
          setError('অনুগ্রহ করে আপনার পুরো নাম লিখুন');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestore-এ ইউজার ডাটা সেভ
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
    }
  };

  if (userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>স্বাগতম Porao অ্যাপে!</Text>
          <Text style={styles.subtitle}>নাম: {userData.name}</Text>
          <Text style={styles.subtitle}>ইমেইল: {userData.email}</Text>
          <Text style={styles.roleBadge}>রোল: {userData.role === 'tutor' ? '👨‍🏫 টিউটর' : '🎓 শিক্ষার্থী'}</Text>
          
          <TouchableOpacity style={styles.button} onPress={() => setUserData(null)}>
            <Text style={styles.buttonText}>লগআউট</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Porao App</Text>
          <Text style={styles.subtitle}>{isLogin ? 'একাউন্টে প্রবেশ করুন' : 'নতুন একাউন্ট তৈরি করুন'}</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="আপনার পুরো নাম"
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.label}>আপনি কি হিসেবে যুক্ত হতে চান?</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[styles.roleButton, role === 'student' && styles.activeRole]} 
                  onPress={() => setRole('student')}>
                  <Text style={role === 'student' ? styles.activeRoleText : styles.roleText}>🎓 শিক্ষার্থী</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleButton, role === 'tutor' && styles.activeRole]} 
                  onPress={() => setRole('tutor')}>
                  <Text style={role === 'tutor' ? styles.activeRoleText : styles.roleText}>👨‍🏫 টিউটর</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="ইমেইল এড্রেস"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="পাসওয়ার্ড"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isLogin ? 'লগইন' : 'সাইন আপ করুন'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isLogin ? 'নতুন একাউন্ট খুলতে চান? সাইন আপ করুন' : 'আগে থেকেই একাউন্ট আছে? লগইন করুন'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleButton: {
    flex: 0.48,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeRole: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleText: {
    color: '#333',
    fontWeight: 'bold',
  },
  activeRoleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  roleBadge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});
