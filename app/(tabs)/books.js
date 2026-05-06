import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../src/constants/theme';
import { bookAPI } from '../../src/services/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const tabs = ['Quran', 'Audiobooks'];

export default function QuranAndAudiobooksScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [audiobooks, setAudiobooks] = useState([]);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const load = async () => {
      try {
        const a = await bookAPI.getAudiobooks();
        setAudiobooks(a.data || []);
      } catch (err) { console.log('Audiobooks load error:', err.message); }
    };
    load();
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const switchTab = (idx) => {
    setActiveTab(idx);
    indicatorX.value = withTiming(idx * (width / 2), { duration: 250 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        {tabs.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => switchTab(i)} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {activeTab === 0 ? (
          /* Quran tab — navigates to the Quran reader */
          <View style={styles.quranContainer}>
            <TouchableOpacity
              style={styles.quranCard}
              activeOpacity={0.85}
              onPress={() => router.push('/quran')}
            >
              <View style={styles.quranIconWrap}>
                <Ionicons name="book" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.quranTitle}>Read the Holy Quran</Text>
              <Text style={styles.quranDesc}>Browse surahs, read translations, and listen to recitations</Text>
              <View style={styles.quranBtn}>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                <Text style={styles.quranBtnText}>Open Quran</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          /* Audiobooks tab */
          <View style={styles.audioList}>
            {audiobooks.map((ab, i) => (
              <Animated.View key={ab.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                <TouchableOpacity style={styles.audioItem} activeOpacity={0.85} onPress={() => router.push(`/audiobook/${ab.id}`)}>
                  <Image source={ab.cover ? { uri: ab.cover } : require('../../assets/icon.png')} style={styles.audioCover} />
                  <View style={styles.audioInfo}>
                    <Text style={styles.audioTitle}>{ab.title}</Text>
                    <Text style={styles.audioNarrator}>Narrated by {ab.narrator}</Text>
                    <View style={styles.audioMeta}>
                      <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.audioDuration}>{ab.duration}</Text>
                      <Ionicons name="star" size={12} color={COLORS.gold} />
                      <Text style={styles.audioRating}>{ab.rating}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.audioPlayBtn} onPress={() => router.push(`/audiobook/${ab.id}`)}>
                    <Ionicons name="play-circle" size={40} color={COLORS.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
            {audiobooks.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="headset-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No audiobooks yet</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.spacing_xl, paddingTop: SIZES.spacing_base },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800' },
  tabBar: {
    flexDirection: 'row', marginTop: SIZES.spacing_base,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder,
    position: 'relative',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { color: COLORS.textMuted, fontSize: SIZES.base, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  indicator: { position: 'absolute', bottom: 0, width: width / 2, height: 2, backgroundColor: COLORS.primary, borderRadius: 1 },
  content: { padding: SIZES.spacing_base },

  // Quran
  quranContainer: { paddingTop: 20 },
  quranCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_xl,
    padding: 28, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  quranIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  quranTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '900', marginBottom: 8 },
  quranDesc: { color: COLORS.textSecondary, fontSize: SIZES.md, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  quranBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: SIZES.radius_md,
  },
  quranBtnText: { color: '#FFF', fontSize: SIZES.md, fontWeight: '800' },

  // Audiobooks
  audioList: { gap: 12 },
  audioItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_lg,
    padding: 12, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  audioCover: { width: 60, height: 60, borderRadius: SIZES.radius_md },
  audioInfo: { flex: 1 },
  audioTitle: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '700' },
  audioNarrator: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 2 },
  audioMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  audioDuration: { color: COLORS.textMuted, fontSize: SIZES.xs, marginRight: 8 },
  audioRating: { color: COLORS.gold, fontSize: SIZES.xs },
  audioPlayBtn: {},
  empty: { justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.md },
});
