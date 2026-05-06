import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CategoryChip({ label, selected, onPress, color = COLORS.primary, icon }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.93); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[animatedStyle, styles.wrapper]}
      activeOpacity={0.8}
    >
      {selected ? (
        <LinearGradient
          colors={[color, color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.chip, styles.selectedChip, { shadowColor: color }]}
        >
          {icon && <Ionicons name={icon} size={14} color="#FFF" style={styles.icon} />}
          <Text style={[styles.label, styles.selectedLabel]}>{label}</Text>
        </LinearGradient>
      ) : (
        <Animated.View style={[styles.chip, styles.unselectedChip]}>
          {icon && <Ionicons name={icon} size={14} color={COLORS.textSecondary} style={styles.icon} />}
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: SIZES.spacing_sm,
    marginBottom: SIZES.spacing_sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing_base,
    paddingVertical: SIZES.spacing_sm + 2,
    borderRadius: SIZES.radius_full,
  },
  selectedChip: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  unselectedChip: {
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#FFF',
    fontWeight: '600',
  },
  icon: {
    marginRight: 6,
  },
});
