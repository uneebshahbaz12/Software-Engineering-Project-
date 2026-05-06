import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import FloatingParticles from '../src/components/FloatingParticles';

const { width, height } = Dimensions.get('window');

// Animated crescent moon that orbits
function OrbitingMoon() {
  const angle = useSharedValue(0);
  const glowScale = useSharedValue(0.8);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000 }),
        withTiming(0.8, { duration: 2000 })
      ),
      -1, true
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => {
    const radius = 110;
    const rad = (angle.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: Math.cos(rad) * radius },
        { translateY: Math.sin(rad) * radius },
        { rotate: `${angle.value}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowScale.value * 0.4,
  }));

  return (
    <Animated.View style={[styles.orbitMoon, moonStyle]}>
      <Animated.View style={[styles.moonGlow, glowStyle]} />
      <Ionicons name="moon" size={28} color={COLORS.goldLight} />
    </Animated.View>
  );
}

// Pulsating ring
function PulseRing({ size, delay, color }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 3000 }),
        withTiming(0.4, { duration: 3000 })
      ), -1, true
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500 }),
        withTiming(0.05, { duration: 4500 })
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color }, style]} />
  );
}

export default function SplashScreen() {
  const logoScale = useSharedValue(0.1);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const bismillahOpacity = useSharedValue(0);
  const tapOpacity = useSharedValue(0);
  const bgGlow = useSharedValue(0);

  useEffect(() => {
    // Bismillah first
    bismillahOpacity.value = withTiming(1, { duration: 800 });

    // Logo entrance with bounce
    logoScale.value = withDelay(400, withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.5)) }));
    logoOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

    // Background glow pulse
    bgGlow.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ), -1, true
    ));

    // Tagline slide up
    taglineOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
    taglineY.value = withDelay(1000, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

    // Tap hint
    tapOpacity.value = withDelay(2000, withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ), -1, true
    ));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const bgGlowStyle = useAnimatedStyle(() => ({
    opacity: bgGlow.value * 0.15,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const bismillahStyle = useAnimatedStyle(() => ({
    opacity: bismillahOpacity.value,
  }));

  const tapStyle = useAnimatedStyle(() => ({
    opacity: tapOpacity.value,
  }));

  return (
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={() => router.replace('/welcome')}>
      <LinearGradient
        colors={['#0A0A0A', '#121212', '#0F0F0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Central glow */}
      <Animated.View style={[styles.centralGlow, bgGlowStyle]} />

      {/* Pulsating rings */}
      <PulseRing size={180} delay={0} color={COLORS.primaryLight + '40'} />
      <PulseRing size={260} delay={500} color={COLORS.goldLight + '25'} />
      <PulseRing size={340} delay={1000} color={COLORS.primaryLight + '15'} />

      {/* Orbiting moon */}
      <OrbitingMoon />

      {/* Bismillah */}
      <Animated.View style={[styles.bismillah, bismillahStyle]}>
        <Text style={styles.bismillahText}>{'\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650'}</Text>
      </Animated.View>

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logoText}>
          <Text style={styles.logoDeen}>DEEN</Text>
          <Text style={styles.logoFlix}>FLIX</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>Illuminate Your Soul</Text>
        <View style={styles.taglineLine}>
          <View style={styles.lineLeft} />
          <Ionicons name="star" size={8} color={COLORS.goldLight} style={{ opacity: 0.6 }} />
          <View style={styles.lineRight} />
        </View>
      </Animated.View>

      {/* Decorative stars */}
      {[...Array(10)].map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeIn.delay(300 + i * 150).duration(800)}
          style={[styles.star, {
            top: `${15 + Math.random() * 70}%`,
            left: `${5 + Math.random() * 90}%`,
            width: 1.5 + Math.random() * 2.5,
            height: 1.5 + Math.random() * 2.5,
            backgroundColor: i % 3 === 0 ? COLORS.goldLight : i % 3 === 1 ? COLORS.primaryLight : '#FFF',
            opacity: 0.3 + Math.random() * 0.5,
          }]}
        />
      ))}

      {/* Tap to continue */}
      <Animated.View style={[styles.tapContainer, tapStyle]}>
        <Ionicons name="chevron-up" size={16} color="#94A3B8" />
        <Text style={styles.tapText}>Tap to continue</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primaryLight,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  orbitMoon: {
    position: 'absolute',
  },
  moonGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.goldLight,
    left: -11,
    top: -11,
  },
  bismillah: {
    marginBottom: 20,
  },
  bismillahText: {
    color: COLORS.goldLight,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 2,
    opacity: 0.8,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 6,
  },
  logoDeen: {
    color: COLORS.primaryLight,
  },
  logoFlix: {
    color: COLORS.goldLight,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: SIZES.lg,
    fontWeight: '300',
    letterSpacing: 3,
    textAlign: 'center',
  },
  taglineLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  lineLeft: {
    width: 40,
    height: 0.5,
    backgroundColor: COLORS.goldLight + '50',
  },
  lineRight: {
    width: 40,
    height: 0.5,
    backgroundColor: COLORS.goldLight + '50',
  },
  star: {
    position: 'absolute',
    borderRadius: 10,
  },
  tapContainer: {
    position: 'absolute',
    bottom: 70,
    alignItems: 'center',
    gap: 4,
  },
  tapText: {
    color: '#64748B',
    fontSize: SIZES.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
