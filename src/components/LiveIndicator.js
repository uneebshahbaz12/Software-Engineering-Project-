import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

export default function LiveIndicator({ title = 'Live Session', subtitle = 'Mufti Menk • Marriage in Islam', onPress }) {
  const dotScale = useSharedValue(1);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1
    );
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.wrapper}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(255, 71, 87, 0.15)', 'rgba(255, 71, 87, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.container}
        >
          {/* Live dot */}
          <View style={styles.liveTag}>
            <Animated.View style={[styles.liveDot, dotStyle]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>

          <View style={styles.joinBtn}>
            <Ionicons name="play" size={14} color="#FFF" />
            <Text style={styles.joinText}>Join</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
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
    padding: SIZES.spacing_md,
    borderRadius: SIZES.radius_lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
    gap: 12,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  liveText: {
    color: '#FF4757',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  info: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF4757',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinText: {
    color: '#FFF',
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
});
