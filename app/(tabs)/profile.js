import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import FloatingParticles from '../../src/components/FloatingParticles';
import GlowButton from '../../src/components/GlowButton';
import { useAuth } from '../../src/context/AuthContext';
import { historyAPI, watchlistAPI } from '../../src/services/api';
import { listDownloads } from '../../src/services/downloads';

const { width } = Dimensions.get('window');

const menuItems = [
  { icon: 'bookmark', label: 'My Watchlist', route: '/watchlist', color: COLORS.primary, countKey: 'watchlist' },
  { icon: 'time', label: 'Watch History', route: '/history', color: COLORS.accent3, countKey: 'history' },
  { icon: 'download', label: 'Downloads', route: '/downloads', color: COLORS.accent1, countKey: 'downloads' },
  { icon: 'happy', label: 'Kids Profile', route: '/kids', color: COLORS.accent4 },
  { icon: 'moon', label: 'Mood Based Content', route: '/mood', color: COLORS.gold },
  { icon: 'heart', label: 'Interests & Preferences', route: '/settings', color: COLORS.accent2 },
  { icon: 'settings', label: 'Settings', route: '/settings', color: COLORS.textSecondary },
];

export default function ProfileScreen() {
  const { user, profiles, activeProfile, logout, switchProfile } = useAuth();
  const avatarGlow = useSharedValue(0.3);
  const [counts, setCounts] = useState({ watchlist: null, history: null, downloads: null });
  const [stats, setStats] = useState([
    { label: 'Watched', value: null, icon: 'play-circle', color: COLORS.primary },
    { label: 'Hours', value: null, icon: 'time', color: COLORS.accent3 },
    { label: 'Streak', value: null, icon: 'flame', color: COLORS.gold },
  ]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [targetProfile, setTargetProfile] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    avatarGlow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ), -1, true
    );
  }, []);

  useEffect(() => {
    if (showPinModal) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [showPinModal]);

  const handleProfilePress = (profile) => {
    // If same profile, do nothing
    if (activeProfile?.id === profile.id) return;
    
    // If target profile has PIN, show PIN modal
    if (profile.pin) {
      setTargetProfile(profile);
      setPin('');
      setShowPinModal(true);
    } else {
      // No PIN needed, switch directly
      switchProfile(profile);
    }
  };

  const handlePinSubmit = async () => {
    if (!targetProfile || pin.length !== 4) return;
    setPinLoading(true);
    try {
      await switchProfile(targetProfile, pin);
      setShowPinModal(false);
      setPin('');
      setTargetProfile(null);
    } catch (e) {
      if (e.message === 'PIN_REQUIRED') {
        Alert.alert('PIN Required', 'This profile is protected with a PIN');
      } else if (e.message === 'INVALID_PIN') {
        Alert.alert('Incorrect PIN', 'Please try again');
        setPin('');
      } else {
        Alert.alert('Error', e.message || 'Failed to switch profile');
      }
    } finally {
      setPinLoading(false);
    }
  };

  const glowStyle = useAnimatedStyle(() => ({
    opacity: avatarGlow.value,
  }));

  const loadCounts = useCallback(async () => {
    try {
      const [watchlistRes, historyRes, downloads] = await Promise.all([
        watchlistAPI.getAll().catch(() => ({ data: [] })),
        historyAPI.getAll().catch(() => ({ data: [] })),
        listDownloads().catch(() => []),
      ]);
      setCounts({
        watchlist: (watchlistRes?.data || []).length,
        history: (historyRes?.data || []).length,
        downloads: (downloads || []).length,
      });
    } catch {
      // keep null — don't reset to 0
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const historyRes = await historyAPI.getAll().catch(() => ({ data: [] }));
      const rows = historyRes?.data || [];
      const watchedCount = rows.length;
      const totalSeconds = rows.reduce((sum, h) => sum + Number(h.progress_seconds || 0), 0);
      const hours = (totalSeconds / 3600).toFixed(1);

      const daySet = new Set(
        rows
          .map((h) => h.last_watched_at || h.watched_at || null)
          .filter(Boolean)
          .map((d) => new Date(d).toISOString().slice(0, 10))
      );
      let streak = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      while (daySet.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      setStats([
        { label: 'Watched', value: String(watchedCount), icon: 'play-circle', color: COLORS.primary },
        { label: 'Hours', value: String(hours), icon: 'time', color: COLORS.accent3 },
        { label: 'Streak', value: String(streak), icon: 'flame', color: COLORS.gold },
      ]);
    } catch {
      // keep defaults
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
      loadStats();
    }, [loadCounts, loadStats])
  );

  return (
    <SafeAreaView style={styles.container}>
      <FloatingParticles density="light" style={{ opacity: 0.2 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileCard}>
          <LinearGradient
            colors={[COLORS.primary + '15', COLORS.gold + '08', COLORS.backgroundCard]}
            style={styles.profileGradient}
          >
            {/* Decorative corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={styles.avatarWrapper}>
              <Animated.View style={[styles.avatarGlow, glowStyle]} />
              <LinearGradient
                colors={[COLORS.primary, COLORS.gold]}
                style={styles.avatarRing}
              >
                <View style={styles.avatarLarge}>
                  <Ionicons name="person" size={34} color={COLORS.primary} />
                </View>
              </LinearGradient>
            </View>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>

            {/* Level badge */}
            <View style={styles.levelBadge}>
              <Ionicons name="diamond" size={12} color={COLORS.gold} />
              <Text style={styles.levelText}>Knowledge Seeker</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Switch Profiles */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Profiles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profilesRow}>
            {(profiles || []).map((p) => (
              <TouchableOpacity key={p.id} style={styles.profileItem} onPress={() => handleProfilePress(p)}>
                <View style={[styles.profileAvatar, { borderColor: p.color || COLORS.primary }, activeProfile?.id === p.id && { shadowColor: p.color || COLORS.primary, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 }]}>
                  {p.is_kids ? (
                    <Ionicons name="happy" size={22} color={p.color || COLORS.accent4} />
                  ) : (
                    <Text style={[styles.profileInitial, { color: p.color || COLORS.primary }]}>{(p.name || '?')[0]}</Text>
                  )}
                </View>
                <Text style={styles.profileItemName}>{p.name}</Text>
                {p.pin && <Ionicons name="lock-closed" size={10} color={COLORS.textMuted} style={styles.lockIcon} />}
                {activeProfile?.id === p.id && <View style={[styles.activeBadge, { backgroundColor: p.color || COLORS.primary }]} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.profileItem} onPress={() => router.push('/profile/manage')}>
              <View style={styles.addProfile}>
                <Ionicons name="add" size={22} color={COLORS.textMuted} />
              </View>
              <Text style={styles.profileItemName}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsRow}>
          {stats.map((s, i) => (
            <TouchableOpacity key={i} style={styles.statCard} activeOpacity={0.7}>
              <LinearGradient
                colors={[s.color + '15', 'transparent']}
                style={styles.statGradient}
              >
                <View style={[styles.statIconBg, { backgroundColor: s.color + '20' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value != null ? s.value : '–'}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(300 + i * 50).duration(400)}>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push(item.route)} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '12' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.countKey && counts[item.countKey] != null && (
                  <View style={[styles.countBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.countText, { color: item.color }]}>{counts[item.countKey]}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/welcome'); }}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Text style={styles.version}>Islam Learning Platform v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* PIN Verification Modal */}
      <Modal visible={showPinModal} animationType="fade" transparent>
        <View style={styles.pinOverlay}>
          <View style={styles.pinCard}>
            <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Text style={styles.pinDesc}>Profile "{targetProfile?.name}" is PIN-protected</Text>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.pinDotsContainer}
              onPress={() => pinInputRef.current?.focus()}
            >
              <View style={styles.pinDots}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                ))}
              </View>
              <TextInput
                ref={pinInputRef}
                value={pin}
                onChangeText={(v) => {
                  const cleaned = v.replace(/[^0-9]/g, '');
                  if (cleaned.length <= 4) setPin(cleaned);
                }}
                keyboardType="number-pad"
                style={styles.pinInput}
                secureTextEntry
                maxLength={4}
                caretHidden
                contextMenuHidden
                selectTextOnFocus={false}
              />
            </TouchableOpacity>
            <View style={styles.pinButtons}>
              <TouchableOpacity onPress={() => { setShowPinModal(false); setPin(''); setTargetProfile(null); }} style={styles.pinCancel}>
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>
              <GlowButton
                title={pinLoading ? 'Verifying...' : 'Verify'}
                onPress={pin.length === 4 ? handlePinSubmit : undefined}
                disabled={pin.length < 4 || pinLoading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SIZES.spacing_base },

  // Profile card
  profileCard: { borderRadius: SIZES.radius_xl, overflow: 'hidden', marginTop: SIZES.spacing_base, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  profileGradient: { alignItems: 'center', paddingVertical: SIZES.spacing_xxl, position: 'relative' },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: COLORS.gold + '25' },
  cornerTL: { top: 12, left: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  avatarWrapper: { alignItems: 'center', justifyContent: 'center' },
  avatarGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary,
  },
  avatarRing: {
    width: 84, height: 84, borderRadius: 42, padding: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  profileName: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800', marginTop: 14 },
  profileEmail: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 4 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.gold + '12', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 12, borderWidth: 1, borderColor: COLORS.gold + '20',
  },
  levelText: { color: COLORS.gold, fontSize: SIZES.xs, fontWeight: '700' },

  // Profiles
  section: { marginTop: SIZES.spacing_xl },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700', marginBottom: SIZES.spacing_md },
  profilesRow: { gap: 16 },
  profileItem: { alignItems: 'center', width: 65 },
  profileAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  profileInitial: { fontSize: SIZES.lg, fontWeight: '700' },
  profileItemName: { color: COLORS.textSecondary, fontSize: SIZES.xs, marginTop: 6, fontWeight: '500' },
  activeBadge: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  addProfile: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.surfaceBorder, borderStyle: 'dashed',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginTop: SIZES.spacing_xl },
  statCard: {
    flex: 1, borderRadius: SIZES.radius_lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  statGradient: {
    padding: 14, alignItems: 'center',
  },
  statIconBg: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  statValue: { fontSize: SIZES.xl, fontWeight: '800', marginTop: 8 },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  // Menu
  menuSection: { marginTop: SIZES.spacing_xl, gap: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: COLORS.textPrimary, fontSize: SIZES.base, fontWeight: '500', flex: 1 },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  countText: { fontSize: 11, fontWeight: '700' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: SIZES.spacing_xl, paddingVertical: 14,
    backgroundColor: COLORS.error + '08', borderRadius: SIZES.radius_lg,
    borderWidth: 1, borderColor: COLORS.error + '20',
  },
  logoutText: { color: COLORS.error, fontSize: SIZES.base, fontWeight: '600' },

  version: {
    color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: SIZES.spacing_lg,
  },

  // PIN Modal
  pinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SIZES.spacing_lg,
    width: '80%',
    alignItems: 'center',
    gap: 12,
  },
  pinTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.lg,
    fontWeight: '700',
    marginTop: 8,
  },
  pinDesc: {
    color: COLORS.textSecondary,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  pinDotsContainer: {
    alignItems: 'center',
    marginVertical: SIZES.spacing_md,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: COLORS.primary,
  },
  pinInput: {
    opacity: 0,
    height: 0,
  },
  pinButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  pinCancel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius_md,
    backgroundColor: COLORS.surfaceBorder,
    justifyContent: 'center',
  },
  pinCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  lockIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});
