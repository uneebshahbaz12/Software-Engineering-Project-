import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import { historyAPI } from '../src/services/api';

export default function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const res = await historyAPI.getAll();
      const list = (res.data || []).map((h) => ({
        ...h.content,
        historyId: h.id,
        progressPercent: h.progress_percent || 0,
        progressSeconds: h.progress_seconds || 0,
        lastWatchedAt: h.last_watched_at,
        scholar: h.content?.scholars?.name || '',
      }));
      setItems(list);
    } catch (err) {
      console.log('History load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const clearAll = async () => {
    Alert.alert('Clear History', 'Are you sure you want to clear all watch history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            await historyAPI.clear();
            setItems([]);
          } catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  const removeItem = async (contentId) => {
    try {
      await historyAPI.remove(contentId);
      setItems((prev) => prev.filter((i) => i.id !== contentId));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Group by relative date
  const groupByDate = (list) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const sections = [];
    const todayItems = list.filter((i) => new Date(i.lastWatchedAt) >= today);
    const yesterdayItems = list.filter((i) => { const d = new Date(i.lastWatchedAt); return d >= yesterday && d < today; });
    const weekItems = list.filter((i) => { const d = new Date(i.lastWatchedAt); return d >= weekAgo && d < yesterday; });
    const olderItems = list.filter((i) => new Date(i.lastWatchedAt) < weekAgo);

    if (todayItems.length) sections.push({ title: 'Today', data: todayItems });
    if (yesterdayItems.length) sections.push({ title: 'Yesterday', data: yesterdayItems });
    if (weekItems.length) sections.push({ title: 'This Week', data: weekItems });
    if (olderItems.length) sections.push({ title: 'Older', data: olderItems });
    if (!sections.length && list.length) sections.push({ title: 'All', data: list });
    return sections;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const sections = groupByDate(items);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Watch History</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No watch history</Text>
          <Text style={styles.emptyDesc}>Content you watch will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(section) => section.title}
          contentContainerStyle={styles.list}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.map((item, index) => (
                <Animated.View key={'hist-' + item.id} entering={FadeInDown.delay(index * 50).duration(400)}>
                  <TouchableOpacity style={styles.item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} activeOpacity={0.8}>
                    <View style={styles.thumbContainer}>
                      <Image source={item.thumbnail ? { uri: item.thumbnail } : require('../assets/icon.png')} style={styles.thumb} />
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${item.progressPercent}%` }]} />
                      </View>
                      <View style={styles.resumeBtn}>
                        <Ionicons name="play" size={16} color="#FFF" />
                      </View>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.itemScholar}>{item.scholar}</Text>
                      <Text style={styles.watchedText}>{item.progressPercent}% watched</Text>
                    </View>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                      <Ionicons name="close-circle" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  clearText: { color: COLORS.error, fontSize: SIZES.sm, fontWeight: '600' },
  list: { paddingHorizontal: SIZES.spacing_base },
  sectionTitle: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '700', marginTop: SIZES.spacing_lg, marginBottom: SIZES.spacing_sm, textTransform: 'uppercase', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder },
  thumbContainer: { position: 'relative' },
  thumb: { width: 120, height: 68, borderRadius: SIZES.radius_sm },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  resumeBtn: { position: 'absolute', top: '50%', left: '50%', marginTop: -12, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  itemTitle: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '600' },
  itemScholar: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 2 },
  watchedText: { color: COLORS.primary, fontSize: SIZES.xs, marginTop: 2 },
  removeBtn: { padding: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  emptyDesc: { color: COLORS.textMuted, fontSize: SIZES.md },
});
