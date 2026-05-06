import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Animated, Dimensions, FlatList, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ReanimatedAnimated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SIZES } from '../../src/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedHeader from '../../src/components/AnimatedHeader';
import ContentCard from '../../src/components/ContentCard';
import ScholarAvatar from '../../src/components/ScholarAvatar';
import SectionHeader from '../../src/components/SectionHeader';
import DailyAyah from '../../src/components/DailyAyah';
import PrayerTimeBanner from '../../src/components/PrayerTimeBanner';
import LiveIndicator from '../../src/components/LiveIndicator';
import { contentAPI, scholarAPI, historyAPI, watchlistAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');

// Greeting based on time
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Assalamu Alaikum', sub: 'May your night be blessed', icon: 'moon' };
  if (hour < 12) return { text: 'Good Morning', sub: 'Start your day with Barakah', icon: 'sunny' };
  if (hour < 17) return { text: 'Good Afternoon', sub: 'Keep seeking knowledge', icon: 'partly-sunny' };
  if (hour < 21) return { text: 'Good Evening', sub: 'Time for reflection', icon: 'cloudy-night' };
  return { text: 'Assalamu Alaikum', sub: 'May your night be blessed', icon: 'moon' };
}

// Auto-scrolling featured carousel
function FeaturedCarousel({ items, onShare }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % items.length;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setActiveIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, items?.length]);

  if (!items || items.length === 0) {
    return (
      <View style={[styles.hero, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textMuted }}>No featured content yet</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      >
        {items.map((item, idx) => (
          <View key={item.id} style={styles.hero}>
            <Image source={item.thumbnail ? { uri: item.thumbnail } : require('../../assets/icon.png')} style={styles.heroImage} />
            <LinearGradient colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.85)']} style={styles.heroGradient}>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <Ionicons name={idx === 0 ? 'flame' : idx === 1 ? 'trending-up' : 'star'} size={12} color={COLORS.goldLight} />
                  <Text style={styles.heroBadgeText}>
                    {idx === 0 ? 'FEATURED' : idx === 1 ? 'TRENDING' : 'TOP RATED'}
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{item.title}</Text>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroScholar}>{item.scholar || item.scholars?.name}</Text>
                  <View style={styles.heroDot} />
                  <Text style={styles.heroDuration}>{item.duration}</Text>
                  <View style={styles.heroDot} />
                  <Ionicons name="star" size={12} color={COLORS.goldLight} />
                  <Text style={styles.heroRating}>{item.rating}</Text>
                </View>
                <View style={styles.heroButtons}>
                  <TouchableOpacity style={styles.playBtn} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })}>
                    <LinearGradient colors={COLORS.gradientPrimary} style={styles.playGradient}>
                      <Ionicons name="play" size={18} color="#FFF" />
                      <Text style={styles.playText}>Play Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={async () => {
                    try {
                      await watchlistAPI.add(item.id);
                      Alert.alert('Saved', 'Added to your watchlist');
                    } catch (e) {
                      Alert.alert('Error', e.message || 'Could not save');
                    }
                  }}>
                    <Ionicons name="bookmark-outline" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={() => onShare?.(item)}>
                    <Ionicons name="share-social-outline" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[
              styles.paginationDot,
              activeIndex === i && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [lectures, setLectures] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [recommendedForYou, setRecommendedForYou] = useState([]);
  const greeting = getGreeting();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contentRes, scholarsRes, featuredRes, cwRes, recRes] = await Promise.all([
        contentAPI.getAll(),
        scholarAPI.getAll(),
        contentAPI.getFeatured(),
        historyAPI.getContinueWatching().catch(() => ({ data: [] })),
        contentAPI.getRecommended().catch(() => ({ data: [] })),
      ]);
      setLectures(contentRes.data.items || []);
      setScholars(scholarsRes.data || []);
      setFeatured(featuredRes.data || []);
      const cwList = (cwRes?.data || []).map((h) => ({
        ...h.content,
        progressPercent: h.progress_percent || 0,
        progressSeconds: h.progress_seconds || 0,
      }));
      setContinueWatching(cwList);

      // FR13/FR45: Personalized recommendations
      const allItems = contentRes.data.items || [];
      const recFromAPI = recRes?.data || [];
      let userInterests = [];
      try {
        const raw = await AsyncStorage.getItem('onboarding_interests');
        if (raw) userInterests = JSON.parse(raw);
      } catch {}
      // Topics user has watched
      const watchedTopicIds = cwList.map((c) => c.topic_id || c.topicId).filter(Boolean);
      // Score each item based on interest match + watch history
      const scored = allItems.map((item) => {
        let score = Math.random() * 2; // base randomness
        const topicName = (item.topic?.name || item.topicName || '').toLowerCase();
        const topicId = item.topic_id || item.topicId;
        // Boost if topic matches user interests
        if (userInterests.some((i) => topicName.includes(String(i).toLowerCase()))) score += 10;
        // Boost if user watched similar topics before
        if (watchedTopicIds.includes(topicId)) score += 5;
        // Boost highly rated
        score += Number(item.rating || 0);
        // Penalize already in continue watching
        if (cwList.some((c) => c.id === item.id)) score -= 20;
        return { ...item, _score: score };
      });
      scored.sort((a, b) => b._score - a._score);
      const personalized = scored.slice(0, 8);
      setRecommendedForYou(recFromAPI.length > 0 ? recFromAPI : personalized);
      if (recFromAPI.length > 0) setLectures(recFromAPI.concat(allItems.filter((x) => !recFromAPI.some((r) => r.id === x.id))));
    } catch (err) {
      console.log('Failed to load data, using empty arrays:', err.message);
    }
  };

  const shareItem = async (item) => {
    try {
      const youtubeId = item?.youtube_video_id || item?.youtubeVideoId;
      const url = youtubeId ? `https://youtu.be/${youtubeId}` : (item?.source_url || item?.sourceUrl || '');
      const message = url ? `${item?.title || 'Islam Learning Platform'}\n${url}` : (item?.title || 'Islam Learning Platform');
      await Share.share({ title: item?.title || 'Islam Learning Platform', message });
    } catch (e) {
      Alert.alert('Share failed', e?.message || 'Could not open share sheet');
    }
  };

  const featuredItems = useMemo(() => {
    const pool = featured.length > 0 ? [...featured] : [...lectures];
    // Shuffle using Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }, [featured, lectures]);

  return (
    <View style={styles.container}>
      <AnimatedHeader scrollY={scrollY} />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingText}>{greeting.text}</Text>
              <Text style={styles.greetingSub}>{greeting.sub}</Text>
            </View>
            <View style={styles.greetingIcon}>
              <Ionicons name={greeting.icon} size={22} color={COLORS.gold} />
            </View>
          </View>
        </View>

        {/* Prayer Time Banner */}
        <PrayerTimeBanner />

        {/* Hero Carousel */}
        <FeaturedCarousel items={featuredItems} onShare={shareItem} />

        {/* Live Session indicator */}
        <LiveIndicator
          title="Live Lecture Now"
          subtitle="Mufti Menk - Keys to Happiness"
          onPress={() => {
            const liveContent = lectures[0] || featuredItems[0];
            if (!liveContent) return;
            router.push({
              pathname: '/player',
              params: {
                contentId: liveContent.id,
                contentData: JSON.stringify(liveContent),
                isLive: 'true'
              }
            });
          }}
        />

        {/* Daily Ayah */}
        <DailyAyah />

        {/* Continue Watching — show only 3 on Home */}
        {continueWatching.length > 0 && (
          <>
            <SectionHeader title="Continue Watching" onSeeAll={() => router.push('/history')} />
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={continueWatching.slice(0, 3)}
              contentContainerStyle={styles.rowPadding}
              keyExtractor={(item) => 'cw-' + item.id}
              renderItem={({ item, index }) => (
                <View>
                  <ContentCard item={item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} index={index} width={200} height={112} />
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={COLORS.gradientPrimary}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${item.progressPercent || 0}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{item.progressPercent || 0}% watched</Text>
                </View>
              )}
            />
          </>
        )}


        {/* Trending */}
        <SectionHeader title="Trending Now" onSeeAll={() => router.push({ pathname: '/(tabs)/explore' })} />
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={lectures.filter((l) => l.is_trending)}
          contentContainerStyle={styles.rowPadding}
          keyExtractor={(item) => 'tr-' + item.id}
          renderItem={({ item, index }) => (
            <ContentCard item={item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} index={index} />
          )}
        />

        {/* Scholars */}
        <SectionHeader title="Top Scholars" onSeeAll={() => router.push({ pathname: '/(tabs)/explore' })} />
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={scholars}
          contentContainerStyle={styles.rowPadding}
          keyExtractor={(item) => 'sc-' + item.id}
          renderItem={({ item, index }) => (
            <ScholarAvatar scholar={item} onPress={() => router.push(`/scholar/${item.id}`)} index={index} />
          )}
        />

        {/* New Releases */}
        <SectionHeader title="New Releases" onSeeAll={() => router.push({ pathname: '/(tabs)/explore' })} />
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={lectures.filter((l) => l.is_new)}
          contentContainerStyle={styles.rowPadding}
          keyExtractor={(item) => 'nr-' + item.id}
          renderItem={({ item, index }) => (
            <ContentCard item={item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} index={index} />
          )}
        />

        {/* Recommended — personalized per user */}
        {recommendedForYou.length > 0 && (
          <>
            <SectionHeader title="Recommended For You" onSeeAll={() => router.push({ pathname: '/(tabs)/explore' })} />
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={recommendedForYou}
              contentContainerStyle={styles.rowPadding}
              keyExtractor={(item) => 'rec-' + item.id}
              renderItem={({ item, index }) => (
                <ContentCard item={item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} index={index} />
              )}
            />
          </>
        )}

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingTop: 0 },
  rowPadding: { paddingHorizontal: SIZES.spacing_base },

  // Greeting
  greetingContainer: {
    paddingHorizontal: SIZES.spacing_base,
    paddingTop: SIZES.headerHeight + 50,
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.xl,
    fontWeight: '700',
  },
  greetingSub: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  greetingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  hero: { width, height: width * 0.75 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: SIZES.spacing_xl },
  heroContent: {},
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,158,11,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 10,
  },
  heroBadgeText: { color: COLORS.goldLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#FFF', fontSize: SIZES.xxxl, fontWeight: '900', lineHeight: 36 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  heroScholar: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.sm },
  heroDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroDuration: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.sm },
  heroRating: { color: COLORS.goldLight, fontSize: SIZES.sm, fontWeight: '600' },
  heroButtons: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  playBtn: { borderRadius: SIZES.radius_md, overflow: 'hidden' },
  playGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: SIZES.radius_md,
  },
  playText: { color: '#FFF', fontSize: SIZES.md, fontWeight: '700' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: -20,
    marginBottom: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted + '40',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  // Progress
  progressBar: { height: 3, backgroundColor: COLORS.surfaceBorder, marginTop: -4, marginHorizontal: 2, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { color: COLORS.textMuted, fontSize: 9, marginTop: 4, marginLeft: 2 },


});
