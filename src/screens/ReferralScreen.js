
// ReferralScreen.js
// Porao App — রেফারেল / ইনভাইট স্ক্রিন
// এই পুরো ফাইলটা src/screens/ReferralScreen.js হিসেবে আপলোড করো (আগের ফাইল রিপ্লেস করবে)

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ensureReferralCode, getReferralStats } from '../services/referralService';

const APP_LINK = 'https://onlinecreativeit24-source.github.io/Porao/';

export default function ReferralScreen() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const code = await ensureReferralCode(user.uid, user.name);
      const data = await getReferralStats(user.uid);
      if (mounted) {
        setStats(data || { code, count: 0, points: 0, referredUsers: [] });
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleShare = async () => {
    if (!stats?.code) return;
    try {
      await Share.share({
        message: `আমি Porao অ্যাপ ব্যবহার করছি — টিউশন খোঁজা, বিডিং আর বই আদান-প্রদান সব এক জায়গায়! 📚\n\nআমার রেফারেল কোড দিয়ে জয়েন করো: ${stats.code}\n\nডাউনলোড/ভিজিট করো: ${APP_LINK}`,
      });
    } catch (err) {
      Alert.alert('শেয়ার করা যায়নি', 'আবার চেষ্টা করো।');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>বন্ধুদের ইনভাইট করো 🎉</Text>
      <Text style={styles.subtext}>
        প্রতি বন্ধু জয়েন করলে তুমি পাবে ১০ পয়েন্ট, আর ৫ জন হলেই বোনাস!
      </Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>তোমার রেফারেল কোড</Text>
        <Text style={styles.codeText}>{stats?.code}</Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>এখনই শেয়ার করো</Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats?.count || 0}</Text>
          <Text style={styles.statLabel}>জন জয়েন করেছে</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats?.points || 0}</Text>
          <Text style={styles.statLabel}>মোট পয়েন্ট</Text>
        </View>
      </View>

      {stats?.referredUsers?.length > 0 && (
        <FlatList
          data={stats.referredUsers}
          keyExtractor={(item) => item}
          style={{ marginTop: 20 }}
          ListHeaderComponent={<Text style={styles.listHeading}>ইনভাইটেড বন্ধুরা</Text>}
          renderItem={({ item, index }) => (
            <Text style={styles.listItem}>👤 বন্ধু #{index + 1}</Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20', marginBottom: 6 },
  subtext: { fontSize: 14, color: '#555', marginBottom: 20 },
  codeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  codeLabel: { fontSize: 13, color: '#2E7D32' },
  codeText: { fontSize: 26, fontWeight: 'bold', color: '#1B5E20', letterSpacing: 2, marginTop: 4 },
  shareButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20' },
  statLabel: { fontSize: 12, color: '#777' },
  listHeading: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  listItem: { fontSize: 14, color: '#444', paddingVertical: 4 },
});
