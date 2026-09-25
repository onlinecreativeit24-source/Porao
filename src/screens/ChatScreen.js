import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { scanSensitive, splitMasked } from '../utils/contentFilter';

// দুই uid থেকে একই chatId সবসময় বানানোর জন্য (sorted join)
export function getChatId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

function MessageBubble({ msg, isMine }) {
  const [revealed, setRevealed] = useState(false);
  const parts = splitMasked(msg.text || '');
  const hasMasked = parts.some((p) => p.masked);

  return (
    <View style={[b.row, isMine ? b.rowMine : b.rowTheirs]}>
      <View style={[b.bubble, isMine ? b.bubbleMine : b.bubbleTheirs]}>
        <Text style={isMine ? b.textMine : b.textTheirs}>
          {parts.map((p, i) =>
            p.masked && !revealed ? (
              <Text key={i} style={b.masked}>{'•'.repeat(Math.min(p.text.length, 10))}</Text>
            ) : (
              <Text key={i}>{p.text}</Text>
            )
          )}
        </Text>
        {hasMasked && (
          <TouchableOpacity
            onPress={() =>
              revealed
                ? setRevealed(false)
                : Alert.alert(
                    'সতর্কতা',
                    'নিরাপত্তার জন্য অ্যাপের বাইরে যোগাযোগ না করাই ভালো। তারপরও দেখতে চান?',
                    [
                      { text: 'বাতিল', style: 'cancel' },
                      { text: 'দেখুন', onPress: () => setRevealed(true) },
                    ]
                  )
            }
          >
            <Text style={b.revealText}>{revealed ? 'আবার লুকান' : '🔒 ব্লার করা তথ্য — দেখতে চাপুন'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const { otherUserId, otherUserName } = route.params || {};
  const chatId = getChatId(user?.uid, otherUserId);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (!user?.uid || !otherUserId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [chatId, user?.uid, otherUserId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid) return;

    const { hasSensitive } = scanSensitive(trimmed);

    // সংবেদনশীল তথ্য (নম্বর/লিংক) থাকলে পাঠানোর আগে কয়েন ব্যালেন্স চেক —
    // কয়েন ০ হলে পাঠানো আটকে যাবে, কয়েন থাকলে পাঠানো যাবে
    if (hasSensitive && !(user?.coins > 0)) {
      Alert.alert(
        'কয়েন প্রয়োজন',
        'ফোন নম্বর বা বাইরের লিংক শেয়ার করতে আপনার অ্যাকাউন্টে অন্তত ১ কয়েন থাকতে হবে। রিচার্জ করবেন?',
        [
          { text: 'বাতিল', style: 'cancel' },
          { text: 'রিচার্জ করুন', onPress: () => navigation.navigate?.('Recharge') },
        ]
      );
      return;
    }

    setText('');

    try {
      // চ্যাট ডকুমেন্ট না থাকলে তৈরি/আপডেট (participants + lastMessage)
      await setDoc(
        doc(db, 'chats', chatId),
        {
          participants: [user.uid, otherUserId].sort(),
          lastMessage: hasSensitive ? '🔒 সংবেদনশীল তথ্য' : trimmed.slice(0, 80),
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: trimmed,
        flagged: hasSensitive,
        createdAt: serverTimestamp(),
      });

      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      Alert.alert('পাঠানো যায়নি', e.message);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{otherUserName || 'চ্যাট'}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} isMine={item.senderId === user?.uid} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="মেসেজ লিখুন..."
            placeholderTextColor="#8794A3"
            multiline
          />
          <TouchableOpacity style={s.sendBtn} onPress={send}>
            <Text style={s.sendText}>পাঠান</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },
  header: {
    padding: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderColor: '#D6DEE8',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F5F8B' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 0.5,
    borderColor: '#D6DEE8',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A2B3C',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#1F5F8B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sendText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});

const b = StyleSheet.create({
  row: { marginBottom: 10, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 14, padding: 10 },
  bubbleMine: { backgroundColor: '#1F5F8B', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#FFF', borderWidth: 0.5, borderColor: '#E1E8F0', borderBottomLeftRadius: 4 },
  textMine: { color: '#FFF', fontSize: 14 },
  textTheirs: { color: '#1A2B3C', fontSize: 14 },
  masked: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: 'transparent',
    textShadowColor: 'rgba(150,150,150,0.9)',
    textShadowRadius: 4,
    borderRadius: 4,
  },
  revealText: { marginTop: 6, fontSize: 11, color: '#F59E0B', fontWeight: '600' },
});
