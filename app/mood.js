import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import ContentCard from '../src/components/ContentCard';
import { MOODS } from '../src/constants/data';
import { moodAPI } from '../src/services/api';

const { width } = Dimensions.get('window');

export default function MoodScreen() {
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedMood = MOODS.find((m) => m.id === selected);

  useEffect(() => {
    const load = async () => {
      if (!selectedMood?.name) return;
      setLoading(true);
      try {
        const res = await moodAPI.getByMood(selectedMood.name);
        setItems(res.data?.items || []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedMood?.name]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mood</Text>
        <View style={{ width: 24 }} />
      </View>

      {!selected ? (
        <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
          <Text style={styles.question}>How are you feeling today?</Text>
          <Text style={styles.questionSub}>We'll recommend content to match your mood</Text>

          <View style={styles.moodGrid}>
            {MOODS.map((mood, i) => (
              <Animated.View key={mood.id} entering={FadeInDown.delay(i * 100).duration(400)}>
                <TouchableOpacity onPress={() => setSelected(mood.id)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={mood.gradient}
                    style={styles.moodCard}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodName}>{mood.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(400)} style={styles.resultsContainer}>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedEmoji}>{selectedMood.emoji}</Text>
            <Text style={styles.selectedName}>Feeling {selectedMood.name}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.resultsTitle}>Recommended for you</Text>

          <FlatList
            data={items}
            keyExtractor={(item) => 'mood-' + item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.resultsGrid}
            renderItem={({ item, index }) => (
              <ContentCard
                item={item}
                onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })}
                width={(width - 44) / 2}
                height={110}
                index={index}
              />
            )}
            ListEmptyComponent={
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textSecondary }}>
                  {loading ? 'Loading recommendations…' : 'No matches for this mood yet'}
                </Text>
              </View>
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: SIZES.spacing_xl },
  question: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800', textAlign: 'center', marginTop: SIZES.spacing_xxl },
  questionSub: { color: COLORS.textSecondary, fontSize: SIZES.md, textAlign: 'center', marginTop: 8 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: SIZES.spacing_xxl },
  moodCard: {
    width: (width - 72) / 2, height: 110,
    borderRadius: SIZES.radius_xl, justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  moodEmoji: { fontSize: 36 },
  moodName: { color: '#FFF', fontSize: SIZES.md, fontWeight: '700' },
  resultsContainer: { flex: 1 },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: SIZES.spacing_base, padding: SIZES.spacing_md,
    backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  selectedEmoji: { fontSize: 24 },
  selectedName: { color: COLORS.textPrimary, fontSize: SIZES.base, fontWeight: '600', flex: 1 },
  changeText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '600' },
  resultsTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700', marginTop: SIZES.spacing_lg, marginLeft: SIZES.spacing_base, marginBottom: SIZES.spacing_md },
  resultsGrid: { paddingHorizontal: SIZES.spacing_base },
  row: { gap: 12, marginBottom: 12 },
});
