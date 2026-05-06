import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Individual floating particle
function Particle({ delay, startX, startY, size, type, color, duration }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Float upward with gentle sway
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-height * 0.4, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );

    // Gentle horizontal sway
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) }),
          withTiming(-30, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Fade in/out cycle
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: duration * 0.3 }),
          withTiming(0.3, { duration: duration * 0.4 }),
          withTiming(0, { duration: duration * 0.3 })
        ),
        -1
      )
    );

    // Slow rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration * 2, easing: Easing.linear }),
        -1
      )
    );

    // Pulse scale
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.4 }),
          withTiming(0.6, { duration: duration * 0.6 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    switch (type) {
      case 'crescent':
        return <Ionicons name="moon" size={size} color={color} />;
      case 'star':
        return <Ionicons name="star" size={size} color={color} />;
      case 'sparkle':
        return <Ionicons name="sparkles" size={size} color={color} />;
      case 'dot':
        return (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            }}
          />
        );
      case 'diamond':
        return (
          <View
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
              borderRadius: 2,
            }}
          />
        );
      case 'ring':
        return (
          <View
            style={{
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size,
              borderWidth: 1,
              borderColor: color,
            }}
          />
        );
      default:
        return (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            }}
          />
        );
    }
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
        },
        animatedStyle,
      ]}
    >
      {getIcon()}
    </Animated.View>
  );
}

const particleConfigs = [
  { startX: width * 0.1, startY: height * 0.2, size: 8, type: 'crescent', color: 'rgba(212, 160, 68, 0.4)', duration: 6000, delay: 0 },
  { startX: width * 0.8, startY: height * 0.3, size: 6, type: 'star', color: 'rgba(0, 200, 150, 0.35)', duration: 7000, delay: 500 },
  { startX: width * 0.5, startY: height * 0.6, size: 10, type: 'sparkle', color: 'rgba(212, 160, 68, 0.3)', duration: 8000, delay: 1000 },
  { startX: width * 0.2, startY: height * 0.8, size: 4, type: 'dot', color: 'rgba(0, 200, 150, 0.5)', duration: 5000, delay: 300 },
  { startX: width * 0.7, startY: height * 0.5, size: 6, type: 'diamond', color: 'rgba(108, 99, 255, 0.3)', duration: 9000, delay: 800 },
  { startX: width * 0.9, startY: height * 0.7, size: 5, type: 'crescent', color: 'rgba(212, 160, 68, 0.35)', duration: 6500, delay: 1500 },
  { startX: width * 0.3, startY: height * 0.4, size: 3, type: 'dot', color: 'rgba(0, 212, 255, 0.4)', duration: 5500, delay: 200 },
  { startX: width * 0.6, startY: height * 0.15, size: 7, type: 'star', color: 'rgba(0, 200, 150, 0.25)', duration: 7500, delay: 700 },
  { startX: width * 0.15, startY: height * 0.55, size: 12, type: 'ring', color: 'rgba(212, 160, 68, 0.15)', duration: 10000, delay: 400 },
  { startX: width * 0.85, startY: height * 0.1, size: 5, type: 'sparkle', color: 'rgba(108, 99, 255, 0.25)', duration: 8500, delay: 1200 },
  { startX: width * 0.4, startY: height * 0.9, size: 4, type: 'diamond', color: 'rgba(0, 200, 150, 0.3)', duration: 6000, delay: 900 },
  { startX: width * 0.55, startY: height * 0.35, size: 3, type: 'dot', color: 'rgba(255, 179, 71, 0.4)', duration: 5000, delay: 600 },
];

export default function FloatingParticles({ density = 'normal', style }) {
  const particles = density === 'light' ? particleConfigs.slice(0, 6) : particleConfigs;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
