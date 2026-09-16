
import React, { useContext } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>📚 Porao</Text>
          <Text style={styles.welcomeText}>স্বাগতম, {user?.name || 'ব্যবহারকারী'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>লগআউট</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 🎁 Referral Banner */}
        <TouchableOpacity 
          style={styles.referralBanner}
          onPress={() => navigation.navigate('Referral')}
          activeOpacity={0.8}
        >
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerTitle}>🎁 বন্ধুকে রেফার করুন</Text>
            <Text style={styles.bannerSub}>সর্বোচ্চ ৳৫০০ পর্যন্ত কোর্স ছাড় পান!</Text>
          </View>
          <View style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>আয় করুন ➔</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>কুইক অপশন</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Text style={styles.cardIcon}>➕</Text>
            <Text style={styles.cardTitle}>নতুন পোস্ট</Text>
            <Text style={styles.cardSub}>টিউশন বা বই শেয়ার করুন</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}
            onPress={() => navigation.navigate('Referral')}
          >
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.cardTitle}>রেফার ব্যালেন্স</Text>
            <Text style={styles.cardSub}>আপনার রিওয়ার্ড দেখুন</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0'
  },
  logoText: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  welcomeText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  content: { padding: 16 },
  
  // Referral Banner Styling
  referralBanner: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3
  },
  bannerLeft: { flex: 1 },
  bannerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  bannerSub: { color: '#DBEAFE', fontSize: 12, marginTop: 4 },
  bannerBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bannerBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 1
  },
  cardIcon: { fontSize: 24, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 11, color: '#64748B', marginTop: 2 }
});
