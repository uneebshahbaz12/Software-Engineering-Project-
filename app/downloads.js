import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import { listDownloads, removeDownload } from '../src/services/downloads';

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (!b) return '';
  const mb = b / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function DownloadsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const usedBytes = useMemo(() => items.reduce((sum, i) => sum + (i.bytes || 0), 0), [items]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listDownloads();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = router.addListener?.('focus', load);
    load();
    return () => unsub?.();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Downloads</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Storage bar — only show when real bytes exist */}
      {usedBytes > 0 && (
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Ionicons name="folder" size={20} color={COLORS.primary} />
            <Text style={styles.storageText}>{formatBytes(usedBytes)} used</Text>
          </View>
          <View style={styles.storageBar}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.storageFill, { width: `${Math.min(100, (usedBytes / (1024 * 1024 * 1024)) * 100)}%` }]}
            />
          </View>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => 'dl-' + item.contentId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="download-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>{loading ? 'Loading…' : 'No downloads yet'}</Text>
            <Text style={styles.emptyDesc}>Download lectures to watch offline</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/player', params: { contentId: item.contentId, localUri: item.localUri } })}
            >
              <Image source={{ uri: item.thumbnail || 'https://picsum.photos/seed/dl/400/225' }} style={styles.thumb} />
              <View style={styles.info}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemMeta}>{item.isStreamed ? 'Saved for streaming' : (formatBytes(item.bytes) ? `${formatBytes(item.bytes)} • ` : '') + 'Downloaded'}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  Alert.alert('Remove download?', 'This will delete the file from your phone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: async () => { await removeDownload(item.contentId); await load(); } },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  storageCard: { marginHorizontal: SIZES.spacing_base, padding: SIZES.spacing_base, backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_lg, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: SIZES.spacing_md },
  storageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  storageText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  storageBar: { height: 6, backgroundColor: COLORS.surfaceBorder, borderRadius: 3, overflow: 'hidden' },
  storageFill: { height: '100%', borderRadius: 3 },
  list: { paddingHorizontal: SIZES.spacing_base },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder },
  thumb: { width: 80, height: 45, borderRadius: SIZES.radius_sm },
  info: { flex: 1 },
  itemTitle: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '600' },
  itemMeta: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 3 },
  dlProgress: { height: 3, backgroundColor: COLORS.surfaceBorder, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  dlFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  deleteBtn: { padding: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  emptyDesc: { color: COLORS.textMuted, fontSize: SIZES.md },
});
