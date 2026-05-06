import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../src/constants/theme';
import { gatheringAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function GatheringRoomScreen() {
  const params = useLocalSearchParams();
  const inviteCode = String(params.inviteCode || '').toUpperCase();
  const [loading, setLoading] = useState(true);
  const [gathering, setGathering] = useState(null);
  const { activeProfile } = useAuth();
  const [ending, setEnding] = useState(false);

  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await gatheringAPI.getAll();
      const list = res.data || [];
      const found = list.find((g) => String(g.invite_code || '').toUpperCase() === inviteCode);
      setGathering(found || null);
    } catch (err) {
      if (isInitial) Alert.alert('Error', err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    if (!inviteCode) return () => {};
    let active = true;
    load(true);
    const t = setInterval(() => { if (active) load(false); }, 7000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [inviteCode, load]);

  const leave = async () => {
    try {
      await gatheringAPI.leave(inviteCode);
      Alert.alert('Left', 'You left the gathering');
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const endGathering = async () => {
    if (!gathering?.id) return;
    Alert.alert('End gathering', 'This will end the gathering for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          try {
            setEnding(true);
            await gatheringAPI.end(gathering.id);
            Alert.alert('Ended', 'Gathering has been ended.');
            router.replace('/(tabs)/gatherings');
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
  };

  const isHost = !!activeProfile?.id && String(activeProfile.id) === String(gathering?.host_profile_id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Gathering</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      ) : !gathering ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={24} color={COLORS.textMuted} />
          <Text style={styles.centerText}>Gathering not found (maybe ended).</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <LinearGradient colors={[COLORS.primary + '22', COLORS.primaryDark + '10']} style={styles.cardInner}>
            <Text style={styles.host}>Host: {gathering.host?.name || 'Host'}</Text>
            <Text style={styles.contentTitle}>{gathering.content?.title || 'Lecture'}</Text>
            <Text style={styles.meta}>
              Invite code: {gathering.invite_code} • Participants: {(gathering.gathering_participants || []).length}/{gathering.max_participants || 5}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  const isHost = !!activeProfile?.id && String(activeProfile.id) === String(gathering.host_profile_id);
                  router.push({
                    pathname: '/player',
                    params: {
                      contentId: gathering.content_id,
                      gatheringInviteCode: gathering.invite_code,
                      gatheringIsHost: isHost ? 'true' : 'false',
                    },
                  });
                }}
              >
                <LinearGradient colors={COLORS.gradientPrimary} style={styles.primaryGrad}>
                  <Ionicons name="play" size={16} color="#FFF" />
                  <Text style={styles.primaryText}>Play</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={leave}>
                <Ionicons name="exit-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.secondaryText}>Leave</Text>
              </TouchableOpacity>
              {isHost && (
                <TouchableOpacity style={styles.secondaryBtn} onPress={endGathering} disabled={ending}>
                  <Ionicons name="stop-circle-outline" size={18} color={COLORS.error} />
                  <Text style={[styles.secondaryText, { color: COLORS.error }]}>{ending ? 'Ending...' : 'End'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing_base,
    paddingVertical: SIZES.spacing_md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 },
  centerText: { color: COLORS.textSecondary, textAlign: 'center' },
  card: { margin: SIZES.spacing_base, borderRadius: SIZES.radius_xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  cardInner: { padding: SIZES.spacing_xl },
  host: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  contentTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '900', marginTop: 6 },
  meta: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  primaryBtn: { borderRadius: SIZES.radius_md, overflow: 'hidden' },
  primaryGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  primaryText: { color: '#FFF', fontSize: SIZES.md, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: SIZES.radius_md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  secondaryText: { color: COLORS.textPrimary, fontWeight: '700' },
});

