import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);

  // রিয়েল-টাইমে ফায়ারস্টোর থেকে পোস্ট রিড করা
  useEffect(() => {
    const q = query(collection(db, 'tuition_posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // টিউটরের বিড বা আবেদনের ফাংশন
  const handleBid = (postId, subject) => {
    Alert.prompt(
      'আবেদন করুন (Bid)',
      `${subject} বিষয়ের জন্য আপনি কত টাকা অফার করতে চান?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'সাবমিট',
          onPress: (fee) => {
            if (fee) {
              Alert.alert('সফল!', `আপনার ৳${fee} টাকার অফার সাবমিট করা হয়েছে।`);
              // পরবর্তীতে বিডস কালেকশনে ডাটা সেভ করার লজিক এখানে যুক্ত হবে
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderPostItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.subject}>{item.subject}</Text>
      <Text style={styles.details}>শ্রেণি: {item.class}</Text>
      <Text style={styles.details}>এলাকা: {item.location}</Text>
      <Text style={styles.budget}>বাজেট: ৳{item.budget}/মাস</Text>

      <TouchableOpacity 
        style={styles.bidBtn}
        onPress={() => handleBid(item.id, item.subject)}
      >
        <Text style={styles.bidBtnText}>টিউশনে আবেদন করুন (Bid)</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* নতুন পোস্ট করার বাটন */}
      <TouchableOpacity 
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createBtnText}>+ নতুন টিউশন পোস্ট করুন</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>সর্বশেষ টিউশন সার্কুলার</Text>

      {/* পোস্ট তালিকা */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f6f8' },
  createBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 2 },
  subject: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  details: { fontSize: 14, color: '#555', marginTop: 3 },
  budget: { fontSize: 16, fontWeight: 'bold', color: '#e67e22', marginTop: 5 },
  bidBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  bidBtnText: { color: '#fff', fontWeight: 'bold' }
});
