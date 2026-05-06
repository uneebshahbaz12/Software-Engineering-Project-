import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { externalAPI } from '../services/api';

const { width } = Dimensions.get('window');

const TEAL_RGB = { r: 29, g: 158, b: 117 }; // #1D9E75
const tealRgba = (a) => `rgba(${TEAL_RGB.r}, ${TEAL_RGB.g}, ${TEAL_RGB.b}, ${a})`;

export default function DailyAyah() {
  const glowPulse = useSharedValue(0.3);
  const borderGlow = useSharedValue(0);
  const [loading, setLoading] = useState(true);
  const [ayah, setAyah] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const referenceText = useMemo(() => {
    if (!ayah) return '';
    return ayah.reference || (ayah.surahName ? `${ayah.surahName} ${ayah.surahNumber}:${ayah.ayahNumber}` : '');
  }, [ayah]);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
    borderGlow.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 }),
          withTiming(0.4, { duration: 3000 })
        ),
        -1,
        true
      )
    );
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setErrorMsg('');
        setLoading(true);
        const res = await externalAPI.getDailyAyah();
        const payload = res?.data || res;
        if (!alive) return;
        setAyah(payload);
      } catch (err) {
        if (!alive) return;
        setErrorMsg(err?.message || 'Failed to load Daily Ayah');
        setAyah(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  // Re-fetch when the calendar day changes (keeps the card fresh without app restart).
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await externalAPI.getDailyAyah();
        const payload = res?.data || res;
        if (!alive) return;
        setAyah(payload);
      } catch {
        // ignore
      }
    };
    const timer = setInterval(() => {
      const now = new Date();
      // run a lightweight refresh shortly after midnight
      if (now.getHours() === 0 && now.getMinutes() < 5) check();
    }, 60 * 1000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    // Inline string for worklet-safety
    borderColor: `rgba(${TEAL_RGB.r}, ${TEAL_RGB.g}, ${TEAL_RGB.b}, ${borderGlow.value * 0.35})`,
  }));

  const handleShare = async () => {
    if (!ayah) return;
    const ref = referenceText || 'Quran';
    const message = `${ayah.arabic || ''}\n\n${ayah.translation || ''}\n\n${ref}`;
    try {
      await Share.share({ title: `Daily Ayah - ${ref}`, message });
    } catch (e) {
      Alert.alert('Share failed', e?.message || 'Could not open share sheet');
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.wrapper}>
      <Animated.View style={[styles.container, borderStyle]}>
        <LinearGradient
          colors={[tealRgba(0.10), tealRgba(0.03), 'rgba(17, 17, 17, 0.92)']}
          style={styles.gradient}
        >
          {/* Decorative corner accents */}
          <View style={[styles.cornerAccent, styles.topLeft]} />
          <View style={[styles.cornerAccent, styles.topRight]} />
          <View style={[styles.cornerAccent, styles.bottomLeft]} />
          <View style={[styles.cornerAccent, styles.bottomRight]} />

          {/* Glow effect behind */}
          <Animated.View style={[styles.glowBg, glowStyle]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="book" size={16} color={COLORS.primary} />
              <Text style={styles.headerText}>Daily Ayah</Text>
            </View>
            {!!referenceText && (
              <View style={styles.referenceBadge}>
                <Text style={styles.referenceText}>{referenceText}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading ayah...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : (
            <>
              {/* Arabic text */}
              <Text style={styles.arabicText}>{ayah?.arabic}</Text>

              {/* Divider with ornament */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Ionicons name="diamond" size={8} color={COLORS.primary} style={{ opacity: 0.55 }} />
                <View style={styles.dividerLine} />
              </View>

              {/* Translation */}
              <Text style={styles.translation}>"{ayah?.translation}"</Text>
            </>
          )}

          {/* Share button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={!ayah || loading}>
            <Ionicons name="share-social-outline" size={14} color={COLORS.primary} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SIZES.spacing_base,
    marginTop: SIZES.spacing_lg,
  },
  container: {
    borderRadius: SIZES.radius_xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradient: {
    padding: SIZES.spacing_xl,
    position: 'relative',
  },
  glowBg: {
    position: 'absolute',
    top: -20,
    left: '30%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: tealRgba(0.10),
  },
  cornerAccent: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primaryLight + '70',
  },
  topLeft: { top: 8, left: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopLeftRadius: 4 },
  topRight: { top: 8, right: 8, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 8, left: 8, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomLeftRadius: 4 },
  bottomRight: { bottom: 8, right: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing_lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  referenceBadge: {
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  referenceText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  arabicText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 38,
    fontWeight: '300',
    marginBottom: SIZES.spacing_md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: SIZES.spacing_md,
    justifyContent: 'center',
  },
  dividerLine: {
    width: 40,
    height: 0.5,
    backgroundColor: COLORS.primaryLight + '70',
  },
  translation: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: SIZES.spacing_lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 0.5,
    borderColor: COLORS.primaryLight + '70',
  },
  shareText: {
    color: COLORS.primary,
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 10 },
  loadingText: { color: COLORS.textMuted, fontSize: SIZES.sm },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  errorText: { color: COLORS.textSecondary, fontSize: SIZES.sm, flexShrink: 1, textAlign: 'center' },
});
