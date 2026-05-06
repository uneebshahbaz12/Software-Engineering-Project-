import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../src/constants/theme';
import GlowButton from '../../src/components/GlowButton';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { contentAPI, gatheringAPI } from '../../src/services/api';

const steps = [
  { icon: 'videocam', title: 'Choose Content', desc: 'Select a lecture to watch together' },
  { icon: 'link', title: 'Invite Friends', desc: 'Share the link with up to 5 people' },
  { icon: 'play', title: 'Watch Together', desc: 'Enjoy synchronized playback' },
];

export default function GatheringsScreen() {
  const routeParams = useLocalSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [gatheringName, setGatheringName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [gatherings, setGatherings] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentOptions, setContentOptions] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await gatheringAPI.getAll();
      setGatherings(res.data || []);
    } catch (err) {
      console.log('Gatherings load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const loadContentOptions = async () => {
    try {
      setContentLoading(true);
      const res = await contentAPI.getAll('limit=40');
      const items = res.data?.items || [];
      setContentOptions(items);
    } catch (e) {
      setContentOptions([]);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (showCreate) loadContentOptions();
  }, [showCreate]);

  useEffect(() => {
    const raw = routeParams?.preselectContentId;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id || typeof id !== 'string') return;
    let alive = true;
    (async () => {
      try {
        const res = await contentAPI.getById(id);
        const item = res.data;
        if (!alive || !item) return;
        setSelectedContent(item);
        setShowCreate(true);
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, [routeParams?.preselectContentId]);

  const activeGatherings = useMemo(() => (gatherings || []).map((g) => ({
    id: g.id,
    name: g.name,
    hostName: g.host?.name || 'Host',
    videoTitle: g.content?.title || 'Lecture',
    participants: Math.min((g.gathering_participants || []).length, g.max_participants || 5),
    maxParticipants: g.max_participants || 5,
    inviteCode: g.invite_code,
    isLive: !!g.is_live,
  })), [gatherings]);

  const onCreate = async () => {
    try {
      if (!gatheringName.trim()) return Alert.alert('Missing', 'Please enter a gathering name');
      if (!selectedContent?.id) return Alert.alert('Missing', 'Please select a lecture for this gathering');
      setCreating(true);
      const res = await gatheringAPI.create({ name: gatheringName.trim(), contentId: selectedContent.id });
      const created = res?.data;
      setShowCreate(false);
      setGatheringName('');
      setSelectedContent(null);
      await load();
      if (created?.invite_code) {
        Alert.alert('Gathering Created', `Invite code: ${created.invite_code}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const onJoin = async () => {
    try {
      const code = inviteCode.trim().toUpperCase();
      if (!code) return Alert.alert('Missing', 'Enter an invite code');
      setJoining(true);
      await gatheringAPI.join(code);
      setInviteCode('');
      await load();
      Alert.alert('Joined', 'You joined the gathering');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Watch Together</Text>
          <Text style={styles.subtitle}>Learn with friends & family</Text>
        </View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroCard}>
          <LinearGradient colors={[COLORS.primary + '20', COLORS.accent1 + '10']} style={styles.heroGradient}>
            <View style={styles.heroIcon}>
              <Ionicons name="people" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>Start a Watch Gathering</Text>
            <Text style={styles.heroDesc}>Invite up to 5 friends to watch Islamic lectures together in real-time</Text>
            <GlowButton title="Create Gathering" onPress={() => setShowCreate(true)} icon="add-circle" style={{ marginTop: 16 }} />
          </LinearGradient>
        </Animated.View>

        {/* Join by invite code */}
        <View style={styles.joinBox}>
          <Text style={styles.joinTitle}>Join with Invite Code</Text>
          <View style={styles.joinRow}>
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              placeholder="e.g. A1B2C3"
              placeholderTextColor={COLORS.textMuted}
              style={styles.joinInput}
            />
            <TouchableOpacity style={styles.joinAction} onPress={onJoin} disabled={joining}>
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.joinGradientBtn}>
                {joining ? <ActivityIndicator color="#FFF" /> : <Text style={styles.joinText}>Join</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Gatherings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Gatherings</Text>
          {loading ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Loading gatherings...</Text>
            </View>
          ) : activeGatherings.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={28} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>No active gatherings</Text>
            </View>
          ) : activeGatherings.map((g, i) => (
            <Animated.View key={g.id} entering={FadeInDown.delay(i * 100).duration(400)}>
              <TouchableOpacity style={styles.gatheringCard} activeOpacity={0.85} onPress={() => router.push(`/gathering/${g.inviteCode}`)}>
                <View style={styles.gatheringHeader}>
                  <View style={styles.gatheringInfo}>
                    <View style={styles.hostRow}>
                      <View style={styles.hostAvatar}>
                        <Text style={styles.hostInitial}>{(g.hostName || 'H')[0]}</Text>
                      </View>
                      <Text style={styles.hostName}>{g.hostName}'s Gathering</Text>
                      {g.isLive && (
                        <View style={styles.liveBadge}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.videoTitle}>{g.videoTitle}</Text>
                  </View>
                </View>
                <View style={styles.gatheringFooter}>
                  <View style={styles.participantsRow}>
                    {[...Array(g.participants)].map((_, j) => (
                      <View key={j} style={[styles.participantDot, { marginLeft: j > 0 ? -8 : 0, backgroundColor: [COLORS.primary, COLORS.primaryLight, COLORS.primaryDark, COLORS.primary, COLORS.primaryLight][j] }]} />
                    ))}
                    <Text style={styles.participantCount}>{g.participants}/{g.maxParticipants}</Text>
                  </View>
                  <TouchableOpacity style={styles.joinBtn}>
                    <LinearGradient colors={COLORS.gradientPrimary} style={styles.joinGradient}>
                      <Text style={styles.joinText}>Join</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            {steps.map((s, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(200 + i * 100).duration(400)} style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Ionicons name={s.icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Gathering</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Gathering Name</Text>
            <TextInput
              value={gatheringName} onChangeText={setGatheringName}
              placeholder="e.g., Friday Study Circle"
              placeholderTextColor={COLORS.textMuted}
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Select Content</Text>
            {selectedContent ? (
              <View style={styles.selectedContent}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                <Text style={styles.selectedContentText} numberOfLines={2}>{selectedContent.title}</Text>
                <TouchableOpacity onPress={() => setSelectedContent(null)}>
                  <Text style={styles.clearSelection}>Clear</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {contentLoading ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : (
              <FlatList
                data={contentOptions}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 220, marginTop: 8 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const on = selectedContent?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.contentRow, on && styles.contentRowOn]}
                      onPress={() => setSelectedContent(item)}
                    >
                      <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? COLORS.primary : COLORS.textMuted} />
                      <Text style={styles.contentRowTitle} numberOfLines={2}>{item.title}</Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={{ color: COLORS.textMuted, paddingVertical: 12 }}>No lectures returned from the server.</Text>}
              />
            )}
            <GlowButton title={creating ? 'Starting...' : 'Start Gathering'} onPress={onCreate} icon="play" style={{ marginTop: 24 }} disabled={creating} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.spacing_xl, paddingTop: SIZES.spacing_base },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 4 },
  heroCard: { margin: SIZES.spacing_base, borderRadius: SIZES.radius_xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  heroGradient: { padding: SIZES.spacing_xl, alignItems: 'center' },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '20',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: COLORS.glowPrimary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  heroTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800', textAlign: 'center' },
  heroDesc: { color: COLORS.textSecondary, fontSize: SIZES.md, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  joinBox: {
    marginHorizontal: SIZES.spacing_base,
    marginTop: 4,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius_xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SIZES.spacing_base,
  },
  joinTitle: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '700', marginBottom: 10 },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  joinInput: {
    flex: 1,
    height: 46,
    borderRadius: SIZES.radius_md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    fontSize: SIZES.base,
  },
  joinAction: { borderRadius: SIZES.radius_md, overflow: 'hidden' },
  joinGradientBtn: { height: 46, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: SIZES.spacing_base, marginTop: SIZES.spacing_xl },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700', marginBottom: SIZES.spacing_md },
  gatheringCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_lg,
    padding: SIZES.spacing_base, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  gatheringHeader: { marginBottom: 12 },
  gatheringInfo: {},
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  hostAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  hostInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  hostName: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '600', flex: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.error + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.error },
  liveText: { color: COLORS.error, fontSize: 9, fontWeight: '800' },
  videoTitle: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  gatheringFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantsRow: { flexDirection: 'row', alignItems: 'center' },
  participantDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.backgroundCard },
  participantCount: { color: COLORS.textMuted, fontSize: SIZES.xs, marginLeft: 8 },
  joinBtn: { borderRadius: SIZES.radius_md, overflow: 'hidden' },
  joinGradient: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: SIZES.radius_md },
  joinText: { color: '#FFF', fontSize: SIZES.sm, fontWeight: '700' },
  stepsContainer: { flexDirection: 'row', gap: 12 },
  stepItem: { flex: 1, backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  stepIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  stepTitle: { color: COLORS.textPrimary, fontSize: SIZES.sm, fontWeight: '700', textAlign: 'center' },
  stepDesc: { color: COLORS.textMuted, fontSize: SIZES.xs, textAlign: 'center', marginTop: 4, lineHeight: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.spacing_xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800' },
  modalLabel: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  modalInput: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius_md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SIZES.spacing_base, height: SIZES.inputHeight, color: COLORS.textPrimary, fontSize: SIZES.base,
  },
  selectedContent: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius_md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SIZES.spacing_base, paddingVertical: 10,
  },
  selectedContentText: { color: COLORS.textPrimary, fontSize: SIZES.sm, flex: 1, fontWeight: '600' },
  clearSelection: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '700' },
  contentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: SIZES.radius_md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    marginBottom: 8, backgroundColor: COLORS.surface,
  },
  contentRowOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  contentRowTitle: { color: COLORS.textPrimary, fontSize: SIZES.sm, flex: 1 },
});
