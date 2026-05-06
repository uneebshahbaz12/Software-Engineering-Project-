import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import { contentAPI } from '../../src/services/api';
import ContentCard from '../../src/components/ContentCard';
import { KIDS_CONTENT } from '../../src/constants/data';

export default function KidsCategoryScreen() {
  const params = useLocalSearchParams();
  const categoryIdRaw = params.categoryId;
  const categoryId = Array.isArray(categoryIdRaw) ? categoryIdRaw[0] : String(categoryIdRaw || '');
  const nameRaw = params.name;
  const categoryName = Array.isArray(nameRaw) ? nameRaw[0] : String(nameRaw || 'Kids');

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const title = useMemo(() => categoryName || 'Kids', [categoryName]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        
        // First try to get from KIDS_CONTENT (hardcoded data)
        const contentItems = KIDS_CONTENT[categoryId] || [];
        if (contentItems.length > 0) {
          if (!alive) return;
          setItems(contentItems);
        } else {
          // Fallback to API if no hardcoded data
          const res = await contentAPI.getAll(`isKids=true&kidsCategory=${encodeURIComponent(categoryId)}&limit=50`);
          const payload = res?.data || res;
          const list = payload?.items || [];
          if (!alive) return;
          setItems(list);
        }
      } catch (e) {
        if (!alive) return;
        setItems([]);
        setErrorMsg(e.message || 'Failed to load');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    if (categoryId) load();
    return () => { alive = false; };
  }, [categoryId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>

      <LinearGradient colors={[COLORS.primary + '10', 'transparent']} style={styles.topFade} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.centerText}>Loading…</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={22} color={COLORS.error} />
          <Text style={styles.centerText}>{errorMsg}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="happy-outline" size={26} color={COLORS.textMuted} />
          <Text style={styles.centerText}>No kids videos in this category yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: SIZES.spacing_base }}
          contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
          renderItem={({ item, index }) => (
            <ContentCard
              item={item}
              width={undefined}
              height={120}
              index={index}
              onPress={() => {
                // If YouTube ID is present, pass it to player
                const playerParams = {
                  pathname: '/player',
                  params: { 
                    contentId: item.id,
                    contentData: JSON.stringify(item),
                    ...(item.youtubeId && { youtubeVideoId: item.youtubeId })
                  }
                };
                router.push(playerParams);
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '800', flex: 1, textAlign: 'center' },
  topFade: { height: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  centerText: { color: COLORS.textSecondary, textAlign: 'center' },
});

