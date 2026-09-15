import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function OnlineCoursesScreen() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'online_courses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(courseData);
    });

    return () => unsubscribe();
  }, []);

  const handleEnroll = (title, fee) => {
    Alert.alert(
      'সাবস্ক্রিপশন ফি',
      `'${title}' কোর্সে যুক্ত হতে ৳${fee} টাকা বিকাশ/নগদে পেমেন্ট করতে হবে।`,
      [
        { text: 'পরে করব', style: 'cancel' },
        { text: 'পেমেন্ট করুন', onPress: () => Alert.alert('পেমেন্ট গেটওয়ে', 'পেমেন্ট অপশন শিগগিরই আসছে!') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>অনলাইন লাইভ কোর্স ও ব্যাচ</Text>
      
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.teacher}>ইনস্ট্রাক্টর: {item.teacherName}</Text>
            <Text style={styles.details}>মোট ক্লাস: {item.totalClasses}টি</Text>
            <Text style={styles.fee}>ফি: ৳{item.fee}</Text>

            <TouchableOpacity 
              style={styles.enrollBtn}
              onPress={() => handleEnroll(item.title, item.fee)}
            >
              <Text style={styles.btnText}>কোর্সে ভর্তি হন</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f6f8' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#007AFF' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 2 },
  courseTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  teacher: { fontSize: 14, color: '#555', marginTop: 4 },
  details: { fontSize: 13, color: '#777', marginTop: 2 },
  fee: { fontSize: 16, fontWeight: 'bold', color: '#28a745', marginTop: 6 },
  enrollBtn: { backgroundColor: '#28a745', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
