import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ScholarAvatar({ scholar, onPress, size = 70, index = 0 }) {
  const scale = useSharedValue(1);
  const borderGlow = useSharedValue(0.5);

  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.5, { duration: 2000 })
      ),
      -1, true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value * 0.5,
  }));

  const colors = [COLORS.primary, COLORS.gold, COLORS.accent1, COLORS.accent3, COLORS.accent2, COLORS.accent4];
  const color = colors[index % colors.length];
  const safeName = String(scholar?.name || 'Scholar');
  const safeLectures = scholar?.lectures === 0 ? 0 : (scholar?.lectures ? Number(scholar.lectures) : null);
  const safeImageUri = scholar?.image ? String(scholar.image) : null;

  return (
    <AnimatedTouchable
      entering={FadeIn.delay(index * 80).duration(400)}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[animatedStyle, styles.container]}
      activeOpacity={0.8}
    >
      <View style={styles.ringWrapper}>
        {/* Animated glow ring */}
        <Animated.View style={[styles.glowRing, { borderColor: color, width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }, glowStyle]} />
        <LinearGradient
          colors={[color, color + '60']}
          style={[styles.gradientRing, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}
        >
          <View style={[styles.imageWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
            <Image
              source={safeImageUri ? { uri: safeImageUri } : require('../../assets/icon.png')}
              style={styles.image}
            />
          </View>
        </LinearGradient>
      </View>
      <Text style={styles.name} numberOfLines={1}>{safeName}</Text>
      {safeLectures !== null && (
        <View style={styles.lecturesBadge}>
          <Text style={styles.lectures}>{String(safeLectures)} lecture{safeLectures !== 1 ? 's' : ''}</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: SIZES.spacing_base,
    width: 88,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  gradientRing: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: SIZES.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  lecturesBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  lectures: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
  },
});
