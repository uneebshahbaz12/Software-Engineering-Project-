import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, SlideOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import { watchlistAPI } from '../src/services/api';

export default function WatchlistScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWatchlist = async () => {
    try {
      const res = await watchlistAPI.getAll();
      const list = (res.data || []).map((w) => ({
        ...w.content,
        watchlistId: w.id,
        scholar: w.content?.scholars?.name || '',
      }));
      setItems(list);
    } catch (err) {
      console.log('Watchlist load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload when screen comes into focus
  useFocusEffect(useCallback(() => { loadWatchlist(); }, []));

  const removeItem = async (contentId) => {
    try {
      await watchlistAPI.remove(contentId);
      setItems((prev) => prev.filter((i) => i.id !== contentId));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Watchlist</Text>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptyDesc}>Save lectures to watch later</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => 'wl-' + item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} exiting={SlideOutRight.duration(300)}>
              <TouchableOpacity style={styles.item} onPress={() => router.push({ pathname: '/player', params: { contentId: item.id, contentData: JSON.stringify(item) } })} activeOpacity={0.8}>
                <Image source={item.thumbnail ? { uri: item.thumbnail } : require('../assets/icon.png')} style={styles.thumb} />
                <View style={styles.info}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.itemScholar}>{item.scholar || item.scholars?.name}</Text>
                  <Text style={styles.itemDuration}>{item.duration}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={COLORS.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
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
  list: { paddingHorizontal: SIZES.spacing_base },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder },
  thumb: { width: 120, height: 68, borderRadius: SIZES.radius_sm },
  info: { flex: 1 },
  itemTitle: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '600' },
  itemScholar: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 2 },
  itemDuration: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  removeBtn: { padding: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  emptyDesc: { color: COLORS.textMuted, fontSize: SIZES.md },
});
