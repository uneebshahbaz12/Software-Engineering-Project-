import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';
import GlowButton from './GlowButton';

export default function OnboardingWrapper({
  step, totalSteps = 5, title, subtitle, children,
  onNext, onBack, nextLabel = 'Next', nextDisabled = false,
  showBack = true, isLast = false,
}) {
  const progress = (step / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.stepText}>{step}/{totalSteps}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttons}>
          {showBack && onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <GlowButton
              title={nextLabel}
              onPress={onNext}
              disabled={nextDisabled}
              colors={isLast ? COLORS.gradientGold : COLORS.gradientPrimary}
              icon={isLast ? 'checkmark-circle' : 'arrow-forward'}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1, paddingHorizontal: SIZES.spacing_xl },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: SIZES.spacing_base },
  progressTrack: { flex: 1, height: 4, backgroundColor: COLORS.surfaceBorder, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepText: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '600' },
  header: { marginTop: SIZES.spacing_xl, marginBottom: SIZES.spacing_lg },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 8 },
  content: { flex: 1 },
  contentInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, paddingBottom: 20 },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: SIZES.spacing_base },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8 },
  backText: { color: COLORS.textSecondary, fontSize: SIZES.md },
});
