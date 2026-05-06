import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import ContentCard from '../../src/components/ContentCard';
import { topicAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');
const sortOptions = ['Popular', 'Newest', 'Rating'];

export default function TopicScreen() {
  const { id } = useLocalSearchParams();
  const [sortBy, setSortBy] = useState('Popular');
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState(null);
  const [lectures, setLectures] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await topicAPI.getById(String(id));
        const payload = res?.data || res;
        if (!alive) return;
        setTopic(payload.topic || null);
        setLectures(payload.lectures || []);
      } catch (e) {
        if (!alive) return;
        setTopic(null);
        setLectures([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  const sortedLectures = useMemo(() => {
    const list = [...(lectures || [])];
    if (sortBy === 'Newest') {
      list.sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
    } else if (sortBy === 'Rating') {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else {
      list.sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0));
    }
    return list;
  }, [lectures, sortBy]);

  const topicColor = topic?.color || COLORS.primary;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={[topicColor + '40', topicColor + '10', COLORS.background]} style={styles.header}>
          <SafeAreaView>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <View style={[styles.topicIcon, { backgroundColor: topicColor + '30' }]}>
                <Ionicons name="book" size={32} color={topicColor} />
              </View>
              <Text style={styles.topicName}>{topic?.name || 'Topic'}</Text>
              <Text style={styles.lectureCount}>
                {loading ? 'Loading…' : `${sortedLectures.length} lectures available`}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Sort */}
        <View style={styles.sortRow}>
          {sortOptions.map((s) => (
            <TouchableOpacity key={s} onPress={() => setSortBy(s)}
              style={[styles.sortChip, sortBy === s && { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}>
              <Text style={[styles.sortText, sortBy === s && { color: COLORS.primary }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lectures */}
        <View style={styles.lectureGrid}>
          {loading ? (
            <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : sortedLectures.length === 0 ? (
            <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textMuted }}>No lectures in this topic yet.</Text>
            </View>
          ) : (
            sortedLectures.map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                <ContentCard
                  item={item}
                  onPress={() => router.push({
                    pathname: '/player',
                    params: { contentId: item.id, contentData: JSON.stringify(item) },
                  })}
                  width={(width - 44) / 2}
                  height={110}
                  index={i}
                />
              </Animated.View>
            ))
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: SIZES.spacing_xl },
  topRow: { paddingHorizontal: SIZES.spacing_base, paddingTop: SIZES.spacing_sm },
  headerContent: { alignItems: 'center', paddingTop: SIZES.spacing_xl },
  topicIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  topicName: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800' },
  lectureCount: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 4 },
  sortRow: { flexDirection: 'row', paddingHorizontal: SIZES.spacing_base, gap: 8, marginVertical: SIZES.spacing_md },
  sortChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radius_full,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, backgroundColor: COLORS.surface,
  },
  sortText: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '600' },
  lectureGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.spacing_base, gap: 12 },
});
