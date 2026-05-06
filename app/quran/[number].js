import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import { externalAPI } from '../../src/services/api';

export default function SurahScreen() {
  const params = useLocalSearchParams();
  const number = Number(params.number);
  const [loading, setLoading] = useState(true);
  const [surah, setSurah] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setErrorMsg('');
        setLoading(true);
        const res = await externalAPI.getQuranSurah(number);
        const payload = res?.data || res;
        if (!alive) return;
        setSurah(payload);
      } catch (err) {
        if (!alive) return;
        setErrorMsg(err?.message || 'Failed to load surah');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    if (number) load();
    return () => { alive = false; };
  }, [number]);

  const title = useMemo(() => {
    if (!surah) return 'Surah';
    return `${surah.englishName || 'Surah'} (${surah.number})`;
  }, [surah]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!surah?.englishNameTranslation && (
            <Text style={styles.subtitle} numberOfLines={1}>{surah.englishNameTranslation} • {surah.revelationType}</Text>
          )}
        </View>
        <View style={{ width: 34 }} />
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
          data={surah?.ayahs || []}
          keyExtractor={(item) => String(item.numberInSurah)}
          contentContainerStyle={{ paddingHorizontal: SIZES.spacing_base, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.ayahCard}>
              <View style={styles.ayahHeader}>
                <View style={styles.ayahBadge}>
                  <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
                </View>
              </View>
              <Text style={styles.arabic}>{item.arabic}</Text>
              {!!item.translation && <Text style={styles.translation}>{item.translation}</Text>}
            </View>
          )}
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
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 },
  centerText: { color: COLORS.textSecondary, textAlign: 'center' },
  ayahCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: SIZES.radius_xl,
    padding: 14,
    marginBottom: 12,
  },
  ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ayahBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '70',
  },
  ayahBadgeText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
  arabic: { color: COLORS.textPrimary, fontSize: 22, lineHeight: 38, textAlign: 'right', fontWeight: '300' },
  translation: { color: COLORS.textSecondary, marginTop: 10, fontSize: SIZES.md, lineHeight: 22 },
});

