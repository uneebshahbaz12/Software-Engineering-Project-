import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Geometric Islamic pattern element
function PatternElement({ x, y, size, color, delay, rotationDuration }) {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 1000 }));
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: rotationDuration, easing: Easing.linear }),
        -1
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {/* 8-pointed star pattern */}
      <View style={[patternStyles.octagonLine, { width: size, borderColor: color }]} />
      <View style={[patternStyles.octagonLine, { width: size, borderColor: color, transform: [{ rotate: '45deg' }] }]} />
      <View style={[patternStyles.octagonLine, { width: size, borderColor: color, transform: [{ rotate: '90deg' }] }]} />
      <View style={[patternStyles.octagonLine, { width: size, borderColor: color, transform: [{ rotate: '135deg' }] }]} />
    </Animated.View>
  );
}

const patternStyles = StyleSheet.create({
  octagonLine: {
    position: 'absolute',
    height: 0,
    borderTopWidth: 0.5,
    top: '50%',
    left: 0,
  },
});

// Animated arch/dome shape
function DomeShape({ x, y, size, color, delay }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.15, { duration: 2000 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 2000, easing: Easing.out(Easing.back) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size * 1.4,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
          borderWidth: 1,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

export default function IslamicPattern({ variant = 'subtle', style }) {
  const patternColor = variant === 'gold'
    ? 'rgba(212, 160, 68, 0.08)'
    : 'rgba(0, 200, 150, 0.06)';

  const domeColor = variant === 'gold'
    ? 'rgba(212, 160, 68, 0.1)'
    : 'rgba(0, 200, 150, 0.08)';

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Geometric patterns scattered */}
      <PatternElement x={-20} y={50} size={80} color={patternColor} delay={0} rotationDuration={30000} />
      <PatternElement x={width - 40} y={150} size={60} color={patternColor} delay={500} rotationDuration={25000} />
      <PatternElement x={width * 0.4} y={-10} size={50} color={patternColor} delay={1000} rotationDuration={35000} />

      {/* Dome silhouettes */}
      <DomeShape x={width * 0.7} y={30} size={40} color={domeColor} delay={200} />
      <DomeShape x={20} y={200} size={30} color={domeColor} delay={600} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
