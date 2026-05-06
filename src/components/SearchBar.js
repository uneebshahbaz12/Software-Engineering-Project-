import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search lectures, scholars...', onFocus, onBlur }) {
  const [focused, setFocused] = useState(false);
  const borderColor = useSharedValue(COLORS.surfaceBorder);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    setFocused(true);
    borderColor.value = withTiming(COLORS.primary, { duration: 200 });
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    borderColor.value = withTiming(COLORS.surfaceBorder, { duration: 200 });
    onBlur?.();
  };

  return (
    <Animated.View style={[styles.container, animatedBorder]}>
      <Ionicons name="search" size={20} color={focused ? COLORS.primary : COLORS.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText?.('')}>
          <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_md,
    borderWidth: 1.5,
    paddingHorizontal: SIZES.spacing_base,
    height: SIZES.inputHeight,
    gap: SIZES.spacing_sm,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.base,
  },
});
