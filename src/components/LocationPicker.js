// LocationPicker.js
// রিইউজেবল জেলা + উপজেলা/এলাকা পিকার (মোডাল, সার্চসহ)
// এই ফাইলটা src/components/LocationPicker.js হিসেবে রাখো

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { BD_LOCATIONS, DISTRICTS } from '../data/bdLocations';

// ছোট বাটন — যেটাতে চাপ দিলে মোডাল খুলবে
export function LocationField({ label, value, placeholder, onPress }) {
  return (
    <TouchableOpacity style={ps.field} onPress={onPress}>
      <Text style={ps.fieldLabel}>{label}</Text>
      <Text style={[ps.fieldValue, !value && ps.fieldPlaceholder]}>
        {value || placeholder || 'নির্বাচন করুন'}
      </Text>
    </TouchableOpacity>
  );
}

// জেলা বাছাইয়ের মোডাল
export function DistrictPickerModal({ visible, onClose, onSelect, selected }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return DISTRICTS;
    return DISTRICTS.filter((d) => d.includes(search.trim()));
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.header}>
            <Text style={ms.title}>জেলা নির্বাচন করুন</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={ms.close}>বন্ধ</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={ms.search}
            placeholder="জেলার নাম লিখে খুঁজুন..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[ms.row, selected === item && ms.rowActive]}
                onPress={() => {
                  onSelect(item);
                  setSearch('');
                  onClose();
                }}
              >
                <Text style={[ms.rowText, selected === item && ms.rowTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={ms.empty}>কোনো জেলা পাওয়া যায়নি</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

// উপজেলা/থানা/এলাকা বাছাইয়ের মোডাল (নির্বাচিত জেলার উপর নির্ভরশীল)
export function AreaPickerModal({ visible, onClose, onSelect, district, selected }) {
  const [search, setSearch] = useState('');
  const areas = district ? BD_LOCATIONS[district] || [] : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return areas;
    return areas.filter((a) => a.includes(search.trim()));
  }, [search, areas]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.header}>
            <Text style={ms.title}>
              {district ? `${district} - এলাকা/থানা নির্বাচন করুন` : 'আগে জেলা নির্বাচন করুন'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={ms.close}>বন্ধ</Text>
            </TouchableOpacity>
          </View>
          {!district ? (
            <Text style={ms.empty}>প্রথমে উপরের জেলা ফিল্ডে চাপ দিয়ে জেলা বাছাই করো</Text>
          ) : (
            <>
              <TextInput
                style={ms.search}
                placeholder="থানা/এলাকার নাম লিখে খুঁজুন..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[ms.row, selected === item && ms.rowActive]}
                    onPress={() => {
                      onSelect(item);
                      setSearch('');
                      onClose();
                    }}
                  >
                    <Text style={[ms.rowText, selected === item && ms.rowTextActive]}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={ms.empty}>কোনো এলাকা পাওয়া যায়নি</Text>}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ps = StyleSheet.create({
  field: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
  },
  fieldLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#1E293B' },
  fieldPlaceholder: { color: '#94A3B8' },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1 },
  close: { color: '#2563EB', fontWeight: '600' },
  search: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  row: { paddingVertical: 13, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowActive: { backgroundColor: '#EFF6FF' },
  rowText: { fontSize: 15, color: '#334155' },
  rowTextActive: { color: '#2563EB', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94A3B8', paddingVertical: 24 },
});
