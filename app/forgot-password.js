import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import GlowButton from '../src/components/GlowButton';
import { authAPI } from '../src/services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSend = async () => {
    if (!email.includes('@')) return;
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      setResetToken(res?.data?.resetToken || '');
      setSent(true);
    } catch (err) {
      setSent(true); // Show success anyway to prevent email enumeration
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {sent ? (
            <Animated.View entering={FadeIn.duration(600)} style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
              </View>
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successDesc}>
                We've sent a password reset link to {email}. Check your inbox.
              </Text>
              {!!resetToken && (
                <View style={styles.devTokenBox}>
                  <Text style={styles.devTokenLabel}>Dev reset token</Text>
                  <Text selectable style={styles.devTokenValue}>{resetToken}</Text>
                  <TouchableOpacity
                    style={styles.devTokenBtn}
                    onPress={() => router.push({ pathname: '/reset-password', params: { token: resetToken } })}
                  >
                    <Text style={styles.devTokenBtnText}>Open Reset Screen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.devTokenBtn, { marginTop: 8, backgroundColor: COLORS.surface }]}
                    onPress={() => Alert.alert('Token', resetToken)}
                  >
                    <Text style={styles.devTokenBtnText}>Show Token</Text>
                  </TouchableOpacity>
                </View>
              )}
              <GlowButton title="Back to Login" onPress={() => router.push('/login')} style={{ marginTop: 32 }} />
            </Animated.View>
          ) : (
            <>
              <View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>
              </View>

              <View style={styles.form}>
                <View>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputRow, focused && styles.inputFocused]}>
                    <Ionicons name="mail-outline" size={20} color={focused ? COLORS.primary : COLORS.textMuted} />
                    <TextInput
                      value={email} onChangeText={setEmail}
                      placeholder="Enter your registered email"
                      placeholderTextColor={COLORS.textMuted} style={styles.input}
                      keyboardType="email-address" autoCapitalize="none"
                      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    />
                  </View>
                </View>
                <GlowButton title="Send Reset Link" onPress={handleSend} loading={loading} icon="send" />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1, paddingHorizontal: SIZES.spacing_xl },
  back: { marginTop: SIZES.spacing_base, marginBottom: SIZES.spacing_xl, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxxl, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginTop: 8, lineHeight: 22 },
  form: { marginTop: SIZES.spacing_xxl, gap: SIZES.spacing_xl },
  label: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '600', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.spacing_sm,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius_md,
    borderWidth: 1.5, borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SIZES.spacing_base, height: SIZES.inputHeight,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundElevated,
  },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.base },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  successIcon: { marginBottom: 24 },
  successTitle: { color: COLORS.textPrimary, fontSize: SIZES.xxl, fontWeight: '800' },
  successDesc: { color: COLORS.textSecondary, fontSize: SIZES.base, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  devTokenBox: {
    marginTop: 16,
    width: '100%',
    backgroundColor: COLORS.backgroundCard,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  devTokenLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  devTokenValue: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  devTokenBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  devTokenBtnText: { color: '#fff', fontWeight: '700' },
});
