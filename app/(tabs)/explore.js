import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import SearchBar from '../../src/components/SearchBar';
import ScholarAvatar from '../../src/components/ScholarAvatar';
import ContentCard from '../../src/components/ContentCard';
import SectionHeader from '../../src/components/SectionHeader';
import FloatingParticles from '../../src/components/FloatingParticles';
import { contentAPI, scholarAPI, topicAPI, searchAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');

const popularSearches = ['Quran Tafsir', 'Marriage', 'Patience', 'Ramadan', 'Dua', 'Seerah', 'Parenting', 'Youth'];

const topicIcons = {
  'Quran Tafsir': 'book',
  'Hadith': 'document-text',
  'Seerah': 'heart',
  'Fiqh': 'scale',
  'Aqeedah': 'shield-checkmark',
  'Islamic History': 'time',
  'Family & Marriage': 'people',
  'Youth': 'flash',
  'Purification of Soul': 'leaf',
  'Daily Reminders': 'notifications',
};

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, s, t, r] = await Promise.all([
          contentAPI.getAll(),
          scholarAPI.getAll(),
          topicAPI.getAll(),
          contentAPI.getRecommended().catch(() => ({ data: [] })),
        ]);
        const base = c.data.items || [];
        const rec = r.data || [];
        const merged = rec.concat(base.filter((x) => !rec.some((y) => y.id === x.id)));
        setLectures(merged);
        setScholars(s.data || []);
        setTopics(t.data || []);
      } catch (err) { console.log('Explore load error:', err.message); }
    };
    load();
  }, []);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Do backend search when query changes
  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    let alive = true;
    const doSearch = async () => {
      setIsSearching(true);
      try {
        // Backend search (checks title via ilike)
        const res = await searchAPI.search(query);
        const backendResults = res?.data?.items || [];
        // Also do client-side search on topic name and description
        const clientMatches = lectures.filter((l) => {
          const q = query.toLowerCase();
          return (
            l.title?.toLowerCase().includes(q) ||
            (l.scholars?.name || '').toLowerCase().includes(q) ||
            (l.topics?.name || '').toLowerCase().includes(q) ||
            (l.description || '').toLowerCase().includes(q)
          );
        });
        // Merge: backend results first, then client matches not already included
        const ids = new Set(backendResults.map((r) => r.id));
        const merged = [...backendResults, ...clientMatches.filter((c) => !ids.has(c.id))];
        if (alive) setSearchResults(merged);
      } catch {
        // Fallback to client-side only
        const q = query.toLowerCase();
        const fallback = lectures.filter((l) => (
          l.title?.toLowerCase().includes(q) ||
          (l.scholars?.name || '').toLowerCase().includes(q) ||
          (l.topics?.name || '').toLowerCase().includes(q) ||
          (l.description || '').toLowerCase().includes(q)
        ));
        if (alive) setSearchResults(fallback);
      } finally {
        if (alive) setIsSearching(false);
      }
    };
    const timer = setTimeout(doSearch, 300); // debounce
    return () => { alive = false; clearTimeout(timer); };
  }, [query, lectures]);

  const filtered = query ? searchResults : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background particles */}
      <FloatingParticles density="light" style={{ opacity: 0.25 }} />

      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover Islamic Knowledge</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearching(true)}
          onBlur={() => !query && setSearching(false)}
        />
      </View>

      {query ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => 'search-' + item.id}
          contentContainerStyle={styles.searchResults}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search" size={40} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>Try searching for "{query}" with different keywords</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
              <TouchableOpacity style={styles.searchItem} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })}>
                <Animated.Image source={item.thumbnail ? { uri: item.thumbnail } : require('../../assets/icon.png')} style={styles.searchThumb} />
                <View style={styles.searchInfo}>
                  <Text style={styles.searchTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.searchMeta}>
                    <View style={styles.scholarTag}>
                      <View style={styles.scholarTagDot} />
                      <Text style={styles.searchScholar}>{item.scholars?.name || item.scholar}</Text>
                    </View>
                    <Text style={styles.searchDuration}>{item.duration}</Text>
                  </View>
                  {item.rating && (
                    <View style={styles.searchRating}>
                      <Ionicons name="star" size={10} color={COLORS.gold} />
                      <Text style={styles.searchRatingText}>{item.rating}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="play-circle" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Quran shortcut */}
          <TouchableOpacity style={styles.quranCard} activeOpacity={0.9} onPress={() => router.push('/quran')}>
            <LinearGradient colors={[COLORS.primary + '25', COLORS.primaryDark + '12']} style={styles.quranGradient}>
              <View style={styles.quranIcon}>
                <Ionicons name="book" size={26} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quranTitle}>Open Quran</Text>
                <Text style={styles.quranSub}>Browse surahs and ayahs</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Popular Searches */}
          <SectionHeader title="Popular Searches" showSeeAll={false} />
          <View style={styles.chipsRow}>
            {popularSearches.map((s, i) => (
              <Animated.View key={s} entering={FadeInDown.delay(i * 50).duration(300)}>
                <TouchableOpacity style={styles.chip} onPress={() => setQuery(s)}>
                  <Ionicons name="trending-up" size={13} color={COLORS.primary} />
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Topics Grid */}
          <SectionHeader title="Browse by Topic" showSeeAll={false} />
          <View style={styles.topicsGrid}>
            {topics.map((t, i) => (
              <Animated.View key={t.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                <TouchableOpacity onPress={() => router.push(`/topic/${t.id}`)}>
                  <LinearGradient
                    colors={[t.color + '25', t.color + '08']}
                    style={styles.topicCard}
                  >
                    <View style={[styles.topicIconBg, { backgroundColor: t.color + '25' }]}>
                      <Ionicons name={topicIcons[t.name] || 'book'} size={22} color={t.color} />
                    </View>
                    <Text style={styles.topicName}>{t.name}</Text>
                    <View style={[styles.topicArrow, { backgroundColor: t.color + '15' }]}>
                      <Ionicons name="chevron-forward" size={12} color={t.color} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Scholars */}
          <SectionHeader title="Browse by Scholar" showSeeAll={false} />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={scholars}
            contentContainerStyle={{ paddingHorizontal: SIZES.spacing_base }}
            keyExtractor={(item) => 'exp-sc-' + item.id}
            renderItem={({ item, index }) => (
              <ScholarAvatar scholar={item} onPress={() => router.push(`/scholar/${item.id}`)} index={index} />
            )}
          />

          {/* Quick picks */}
          <SectionHeader title="Quick Picks" showSeeAll={false} />
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={lectures.slice(5, 10)}
            contentContainerStyle={{ paddingHorizontal: SIZES.spacing_base }}
            keyExtractor={(item) => 'qp-' + item.id}
            renderItem={({ item, index }) => (
              <ContentCard item={item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} index={index} />
            )}
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.spacing_xl, paddingTop: SIZES.spacing_base },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 2 },
  searchContainer: { paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  content: { paddingBottom: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.spacing_base, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius_full,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  chipText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.spacing_base, gap: 10 },
  topicCard: {
    width: (width - 42) / 2, height: 100,
    borderRadius: SIZES.radius_lg, justifyContent: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    position: 'relative',
  },
  topicIconBg: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  topicName: { color: COLORS.textPrimary, fontSize: SIZES.sm, fontWeight: '600' },
  topicArrow: {
    position: 'absolute', bottom: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  searchResults: { paddingHorizontal: SIZES.spacing_base },
  searchItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder,
  },
  searchThumb: { width: 120, height: 68, borderRadius: SIZES.radius_sm },
  searchInfo: { flex: 1, justifyContent: 'center' },
  searchTitle: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '600' },
  searchMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  scholarTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scholarTagDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
  searchScholar: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '500' },
  searchDuration: { color: COLORS.textMuted, fontSize: SIZES.xs },
  searchRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  searchRatingText: { color: COLORS.gold, fontSize: SIZES.xs, fontWeight: '600' },
  emptySearch: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center', maxWidth: 250 },
  quranCard: {
    marginHorizontal: SIZES.spacing_base,
    marginBottom: SIZES.spacing_md,
    borderRadius: SIZES.radius_xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  quranGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SIZES.spacing_lg },
  quranIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '70',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quranTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '800' },
  quranSub: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 2 },
});
