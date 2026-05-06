import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import GlowButton from '../src/components/GlowButton';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();

  const validate = () => {
    const e = {};
    if (!email.includes('@')) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.inputRow,
    focusedField === field && styles.inputFocused,
    errors[field] && styles.inputError,
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to continue your journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View>
              <Text style={styles.label}>Email</Text>
              <View style={inputStyle('email')}>
                <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? COLORS.primary : COLORS.textMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View>
              <Text style={styles.label}>Password</Text>
              <View style={inputStyle('password')}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? COLORS.primary : COLORS.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.error}>{errors.password}</Text>}
            </View>

            {/* Forgot */}
            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <GlowButton title="Login" onPress={handleLogin} loading={loading} icon="log-in-outline" />
          </View>

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SIZES.spacing_xl, paddingBottom: 40, flexGrow: 1 },
  back: { marginTop: SIZES.spacing_base, marginBottom: SIZES.spacing_xl, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxxl, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginTop: 8 },
  form: { marginTop: SIZES.spacing_xxl, gap: SIZES.spacing_lg },
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
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.base },
  error: { color: COLORS.error, fontSize: SIZES.xs, marginTop: 4 },
  forgot: { alignSelf: 'flex-end' },
  forgotText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.spacing_xxl },
  footerText: { color: COLORS.textSecondary, fontSize: SIZES.md },
  footerLink: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '700' },
});
