import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function GlowButton({
  title,
  onPress,
  colors = COLORS.gradientPrimary,
  style,
  textStyle,
  icon,
  disabled = false,
  loading = false,
  outline = false,
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  if (outline) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, styles.outlineButton, style]}
        activeOpacity={0.8}
      >
        {icon && <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.icon} />}
        <Text style={[styles.outlineText, textStyle]}>{title}</Text>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, style]}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.glowWrapper, glowStyle]}>
        <View style={[styles.glow, { backgroundColor: colors[0] }]} />
      </Animated.View>
      <LinearGradient
        colors={disabled ? ['#444', '#333', '#2A2A2A'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <View style={styles.content}>
            {icon && <Ionicons name={icon} size={20} color="#FFF" style={styles.icon} />}
            <Text style={[styles.text, textStyle]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius_lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing_xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: SIZES.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: SIZES.spacing_sm,
  },
  glowWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: SIZES.radius_lg,
    overflow: 'hidden',
  },
  glow: {
    flex: 1,
    borderRadius: SIZES.radius_lg,
    opacity: 0.3,
    transform: [{ scale: 1.1 }],
  },
  outlineButton: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius_lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing_xl,
  },
  outlineText: {
    color: COLORS.primary,
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
});
