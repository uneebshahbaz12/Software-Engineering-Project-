import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import { externalAPI } from '../../src/services/api';

export default function QuranScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [surahs, setSurahs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setErrorMsg('');
        setLoading(true);
        const res = await externalAPI.getQuranSurahs();
        const list = res?.data || res || [];
        if (!alive) return;
        setSurahs(list);
      } catch (err) {
        if (!alive) return;
        setErrorMsg(err?.message || 'Failed to load Quran');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!query) return surahs;
    const q = query.trim().toLowerCase();
    return surahs.filter((s) =>
      String(s.number) === q ||
      (s.englishName || '').toLowerCase().includes(q) ||
      (s.englishNameTranslation || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q)
    );
  }, [query, surahs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Quran</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search surah (name or number)"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={22} color={COLORS.error} />
          <Text style={styles.centerText}>{errorMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.row}
              onPress={() => router.push(`/quran/${item.number}`)}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.surahName}>{item.englishName}</Text>
                <Text style={styles.surahSub}>
                  {item.englishNameTranslation} • {item.revelationType} • {item.numberOfAyahs} ayahs
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search" size={28} color={COLORS.textMuted} />
              <Text style={styles.centerText}>No surahs found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing_base,
    paddingVertical: SIZES.spacing_md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: SIZES.radius_lg,
    marginHorizontal: SIZES.spacing_base,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.base },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: SIZES.spacing_base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '70',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: COLORS.primary, fontWeight: '800' },
  surahName: { color: COLORS.textPrimary, fontSize: SIZES.base, fontWeight: '700' },
  surahSub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 },
  centerText: { color: COLORS.textSecondary, textAlign: 'center' },
});

