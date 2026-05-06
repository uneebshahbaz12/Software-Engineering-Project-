import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import GlowButton from '../src/components/GlowButton';
import { authAPI } from '../src/services/api';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token;

  const [token, setToken] = useState(tokenParam ? String(tokenParam) : '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const run = async () => {
      setValidating(true);
      try {
        const res = await authAPI.validateResetToken(token);
        if (mounted) setTokenValid(!!res?.data?.valid);
      } catch {
        if (mounted) setTokenValid(false);
      } finally {
        if (mounted) setValidating(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [token]);

  const handleReset = async () => {
    if (!token || token.length < 20) return Alert.alert('Invalid token', 'Please enter a valid reset token.');
    if (password.length < 6) return Alert.alert('Invalid password', 'Password must be at least 6 characters.');
    if (password !== confirm) return Alert.alert('Mismatch', 'Password and confirm password must match.');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      Alert.alert('Success', 'Password reset successful. Please login with your new password.');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Reset failed', err.message || 'Could not reset password');
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

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your token and set a new password.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Reset Token</Text>
            <TextInput
              value={token}
              onChangeText={setToken}
              placeholder="Paste reset token"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              autoCapitalize="none"
            />
            {validating ? <Text style={styles.info}>Validating token...</Text> : null}
            {tokenValid === true ? <Text style={styles.valid}>Token is valid.</Text> : null}
            {tokenValid === false ? <Text style={styles.invalid}>Token is invalid or expired.</Text> : null}

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { borderWidth: 0, paddingHorizontal: 0, flex: 1 }]}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass((s) => !s)}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              secureTextEntry={!showPass}
            />

            <GlowButton title="Reset Password" onPress={handleReset} loading={loading} icon="checkmark-circle-outline" />
          </View>
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
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginTop: 8 },
  form: { marginTop: SIZES.spacing_xl, gap: 10 },
  label: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SIZES.spacing_base,
    color: COLORS.textPrimary,
    height: SIZES.inputHeight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius_md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SIZES.spacing_base,
    height: SIZES.inputHeight,
  },
  info: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  valid: { color: COLORS.success, fontSize: 12, marginTop: 4 },
  invalid: { color: COLORS.error, fontSize: 12, marginTop: 4 },
});
