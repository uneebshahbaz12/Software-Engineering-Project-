import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../src/constants/theme';
import GlowButton from '../src/components/GlowButton';

const { width } = Dimensions.get('window');

const features = [
  { icon: 'play-circle', title: 'Stream Islamic Lectures', desc: 'Access thousands of lectures from top scholars worldwide', color: COLORS.primary },
  { icon: 'book', title: 'Books & Audiobooks', desc: 'Read and listen to authentic Islamic literature', color: COLORS.primaryDark },
  { icon: 'people', title: 'Watch Together', desc: 'Join group sessions and learn with friends & family', color: COLORS.primaryLight },
  { icon: 'sparkles', title: 'Personalized For You', desc: 'AI-curated content based on your interests and mood', color: COLORS.primary },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Top accent gradient */}
      <LinearGradient colors={[COLORS.primary + '20', 'transparent']} style={styles.topAccent} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="moon" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.logo}>
              <Text style={{ color: COLORS.primary }}>Deen</Text>
              <Text style={{ color: COLORS.primaryDark }}>flix</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>Your Gateway to Islamic Knowledge</Text>

          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Ionicons name="diamond" size={6} color={COLORS.primaryLight + 'AA'} />
            <View style={styles.sepLine} />
          </View>
        </Animated.View>

        {/* Features */}
        <View style={styles.features}>
          {features.map((f, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(300 + i * 150).duration(500)} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '15', borderColor: f.color + '30' }]}>
                <Ionicons name={f.icon} size={26} color={f.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Stats banner */}
        <Animated.View entering={FadeInDown.delay(900).duration(500)} style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>Lectures</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>200+</Text>
            <Text style={styles.statLabel}>Scholars</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.delay(1100).duration(500)} style={styles.buttons}>
          <GlowButton title="Get Started" onPress={() => router.push('/register')} icon="rocket" />
          <GlowButton title="Already have an account? Login" onPress={() => router.push('/login')} outline style={{ marginTop: 14 }} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_xl, paddingBottom: SIZES.spacing_xxl },
  header: { alignItems: 'center', marginTop: SIZES.spacing_xxxl },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: 46, fontWeight: '900', letterSpacing: 3 },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginTop: 10, letterSpacing: 0.5 },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  sepLine: { width: 30, height: 0.5, backgroundColor: COLORS.primaryLight + '80' },
  features: { gap: SIZES.spacing_lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.spacing_base },
  featureIcon: {
    width: 54, height: 54, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  featureText: { flex: 1 },
  featureTitle: { color: COLORS.textPrimary, fontSize: SIZES.base, fontWeight: '700' },
  featureDesc: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginTop: 3, lineHeight: 18 },
  statsBanner: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius_lg,
    paddingVertical: SIZES.spacing_base,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  statItem: { alignItems: 'center' },
  statNumber: { color: COLORS.primary, fontSize: SIZES.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.surfaceBorder },
  buttons: { gap: 0 },
});
