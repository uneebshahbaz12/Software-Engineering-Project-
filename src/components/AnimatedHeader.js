import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';
import { router } from 'expo-router';

export default function AnimatedHeader({ scrollY, title = 'Islam Learning Platform', showBack = false, onBackPress }) {
  const insets = useSafeAreaInsets();

  const headerBg = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: ['transparent', COLORS.background + 'F5'],
        extrapolate: 'clamp',
      })
    : COLORS.background;

  const borderOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <RNAnimated.View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerBg }]}>
      <RNAnimated.View style={[styles.border, { opacity: borderOpacity }]} />
      <View style={styles.content}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={onBackPress || (() => router.back())} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>
            {title === 'Islam Learning Platform' ? (
              <>
                <Text style={styles.titleGreen}>Islam </Text>
                <Text style={styles.titleTealDeep}>Learning Platform</Text>
              </>
            ) : title}
          </Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile/manage')}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, paddingBottom: 10 },
  border: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: COLORS.surfaceBorder },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base },
  left: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: SIZES.spacing_md, padding: 4 },
  title: { fontSize: SIZES.xxl, fontWeight: '800' },
  titleGreen: { color: COLORS.primary },
  titleTealDeep: { color: COLORS.primaryDark },
  right: { flexDirection: 'row', alignItems: 'center', gap: SIZES.spacing_md },
  iconBtn: { position: 'relative' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
});
