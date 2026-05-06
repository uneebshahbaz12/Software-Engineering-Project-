import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

// Static prayer times (in a real app, fetch from an API based on location)
const PRAYER_TIMES = [
  { name: 'Fajr', time: '05:15', icon: 'moon' },
  { name: 'Dhuhr', time: '12:30', icon: 'sunny' },
  { name: 'Asr', time: '15:45', icon: 'partly-sunny' },
  { name: 'Maghrib', time: '18:20', icon: 'cloudy-night' },
  { name: 'Isha', time: '19:50', icon: 'moon' },
];

function getNextPrayer() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of PRAYER_TIMES) {
    const [h, m] = prayer.time.split(':').map(Number);
    if (h * 60 + m > currentMinutes) {
      const diff = h * 60 + m - currentMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return { ...prayer, remaining: hours > 0 ? `${hours}h ${mins}m` : `${mins}m` };
    }
  }
  // After Isha, next is Fajr
  return { ...PRAYER_TIMES[0], remaining: 'Tomorrow' };
}

export default function PrayerTimeBanner() {
  const [nextPrayer, setNextPrayer] = useState(getNextPrayer());
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 })
      ),
      -1,
      true
    );

    const interval = setInterval(() => setNextPrayer(getNextPrayer()), 60000);
    return () => clearInterval(interval);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View entering={FadeInRight.duration(600)} style={styles.wrapper}>
      <LinearGradient
        colors={['rgba(0, 200, 150, 0.12)', 'rgba(0, 200, 150, 0.04)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Glow behind icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.iconGlow, glowStyle]} />
          <Animated.View style={pulseStyle}>
            <Ionicons name={nextPrayer.icon} size={24} color={COLORS.primary} />
          </Animated.View>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>Next Prayer</Text>
          <View style={styles.nameRow}>
            <Text style={styles.prayerName}>{nextPrayer.name}</Text>
            <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
          </View>
        </View>

        <View style={styles.countdownBadge}>
          <Ionicons name="time-outline" size={12} color={COLORS.primary} />
          <Text style={styles.countdown}>{nextPrayer.remaining}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SIZES.spacing_base,
    marginTop: SIZES.spacing_md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing_base,
    borderRadius: SIZES.radius_lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },
  info: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  prayerName: {
    color: COLORS.textPrimary,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  prayerTime: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countdown: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
});
