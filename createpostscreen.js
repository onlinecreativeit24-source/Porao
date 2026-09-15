import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function CreatePostScreen({ navigation }) {
  const [subject, setSubject] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');

  const handlePostTuition = async () => {
    if (!subject || !studentClass || !location || !budget) {
      Alert.alert('ভুল তথ্য', 'অনুগ্রহ করে সব তথ্য দিন');
      return;
    }

    try {
      await addDoc(collection(db, 'tuition_posts'), {
        studentId: auth.currentUser?.uid || 'anonymous',
        studentEmail: auth.currentUser?.email || '',
        subject: subject,
        class: studentClass,
        location: location,
        budget: Number(budget),
        status: 'open',
        createdAt: serverTimestamp()
      });

      Alert.alert('সফল!', 'আপনার টিউশন সার্কুলারটি পাবলিশ হয়েছে');
      navigation.goBack();
    } catch (error) {
      Alert.alert('এরর', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>টিউশন পোস্ট করুন</Text>

      <TextInput
        style={styles.input}
        placeholder="কোন বিষয়? (যেমন: সাধারণ গণিত)"
        value={subject}
        onChangeText={setSubject}
      />

      <TextInput
        style={styles.input}
        placeholder="শ্রেণি (যেমন: Class 9)"
        value={studentClass}
        onChangeText={setStudentClass}
      />

      <TextInput
        style={styles.input}
        placeholder="এলাকা/ঠিকানা (যেমন: ধানমণ্ডি, ঢাকা)"
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        style={styles.input}
        placeholder="বাজেট/মাসিক ফি (টাকায়)"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handlePostTuition}>
        <Text style={styles.btnText}>পাবলিশ করুন</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#007AFF', textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, fontSize: 16 },
  submitBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
