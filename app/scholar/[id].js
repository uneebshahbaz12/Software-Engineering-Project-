import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import ContentCard from '../../src/components/ContentCard';
import { scholarAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function ScholarScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [scholar, setScholar] = useState(null);
  const [lectures, setLectures] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await scholarAPI.getById(String(id));
        const payload = res?.data || res;
        if (!alive) return;
        setScholar(payload.scholar || null);
        setLectures(payload.lectures || []);
      } catch (e) {
        if (!alive) return;
        setScholar(null);
        setLectures([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  const totalViews = (lectures || []).reduce((sum, l) => sum + Number(l.view_count || 0), 0);
  const avgRating = (() => {
    const list = (lectures || []).map((l) => Number(l.rating)).filter((n) => !Number.isNaN(n) && n > 0);
    if (!list.length) return Number(scholar?.rating || 0) || 0;
    return list.reduce((a, b) => a + b, 0) / list.length;
  })();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerArea}>
          <Image source={scholar?.image ? { uri: scholar.image } : require('../../assets/icon.png')} style={styles.headerImage} />
          <LinearGradient colors={COLORS.gradientOverlay} style={styles.headerGradient}>
            <SafeAreaView>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            </SafeAreaView>
            <View style={styles.headerContent}>
              <Text style={styles.name}>{scholar?.name || 'Scholar'}</Text>
              <Text style={styles.bio}>{scholar?.bio || ''}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{lectures.length}</Text>
                  <Text style={styles.statLabel}>Lectures</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{avgRating ? avgRating.toFixed(1) : '—'}</Text>
                  <Text style={styles.statLabel}>Avg rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalViews}</Text>
                  <Text style={styles.statLabel}>Total views</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Lectures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Lectures ({lectures.length})</Text>
          <View style={styles.lectureGrid}>
            {loading ? (
              <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : lectures.length === 0 ? (
              <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>No lectures for this scholar yet.</Text>
              </View>
            ) : (
              lectures.map((item, i) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(i * 80).duration(400)}>
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
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerArea: { width, height: 320, position: 'relative' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  backBtn: { padding: SIZES.spacing_base },
  headerContent: { padding: SIZES.spacing_xl },
  name: { color: '#FFF', fontSize: SIZES.xxxl, fontWeight: '800' },
  bio: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 20 },
  stat: { alignItems: 'center' },
  statValue: { color: COLORS.primary, fontSize: SIZES.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.surfaceBorder },
  section: { padding: SIZES.spacing_base },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700', marginBottom: SIZES.spacing_md },
  lectureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
