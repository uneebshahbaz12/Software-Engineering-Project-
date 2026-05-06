import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../src/constants/theme';
import GlowButton from '../src/components/GlowButton';
import { useAuth } from '../src/context/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuth();

  const strengthWidth = useSharedValue(0);
  const strengthColor = useSharedValue(COLORS.error);

  const strengthStyle = useAnimatedStyle(() => ({
    width: `${strengthWidth.value}%`,
    backgroundColor: strengthColor.value,
  }));

  const handlePasswordChange = (val) => {
    setPassword(val);
    let str = 0;
    if (val.length >= 6) str += 25;
    if (val.length >= 10) str += 25;
    if (/[A-Z]/.test(val)) str += 25;
    if (/[0-9!@#$%]/.test(val)) str += 25;
    strengthWidth.value = withTiming(str, { duration: 300 });
    strengthColor.value = str <= 25 ? COLORS.error : str <= 50 ? COLORS.warning : str <= 75 ? COLORS.info : COLORS.success;
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.includes('@')) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'Min 6 characters';
    if (password !== confirmPass) e.confirm = 'Passwords do not match';
    if (!agreed) e.terms = 'You must agree to terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/onboarding/profession');
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your Islamic learning journey</Text>
          </View>

          <View style={styles.form}>
            {/* Name */}
            <View>
              <Text style={styles.label}>Full Name</Text>
              <View style={inputStyle('name')}>
                <Ionicons name="person-outline" size={20} color={focusedField === 'name' ? COLORS.primary : COLORS.textMuted} />
                <TextInput value={name} onChangeText={setName} placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted} style={styles.input}
                  onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} />
              </View>
              {errors.name && <Text style={styles.error}>{errors.name}</Text>}
            </View>

            {/* Email */}
            <View>
              <Text style={styles.label}>Email</Text>
              <View style={inputStyle('email')}>
                <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? COLORS.primary : COLORS.textMuted} />
                <TextInput value={email} onChangeText={setEmail} placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted} style={styles.input} keyboardType="email-address" autoCapitalize="none"
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
              </View>
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View>
              <Text style={styles.label}>Password</Text>
              <View style={inputStyle('password')}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? COLORS.primary : COLORS.textMuted} />
                <TextInput value={password} onChangeText={handlePasswordChange} placeholder="Create a password"
                  placeholderTextColor={COLORS.textMuted} style={styles.input} secureTextEntry={!showPass}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.strengthBar}>
                <Animated.View style={[styles.strengthFill, strengthStyle]} />
              </View>
              {errors.password && <Text style={styles.error}>{errors.password}</Text>}
            </View>

            {/* Confirm */}
            <View>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={inputStyle('confirm')}>
                <Ionicons name="shield-checkmark-outline" size={20} color={focusedField === 'confirm' ? COLORS.primary : COLORS.textMuted} />
                <TextInput value={confirmPass} onChangeText={setConfirmPass} placeholder="Confirm password"
                  placeholderTextColor={COLORS.textMuted} style={styles.input} secureTextEntry={!showPass}
                  onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)} />
              </View>
              {errors.confirm && <Text style={styles.error}>{errors.confirm}</Text>}
            </View>

            {/* Terms */}
            <TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.termsRow}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.termsText}>I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text></Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.error}>{errors.terms}</Text>}

            <GlowButton title="Create Account" onPress={handleRegister} loading={loading} icon="person-add-outline" />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Login</Text>
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
  back: { marginTop: SIZES.spacing_base, marginBottom: SIZES.spacing_lg, width: 40 },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xxxl, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginTop: 8 },
  form: { marginTop: SIZES.spacing_xl, gap: SIZES.spacing_lg },
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
  strengthBar: { height: 3, backgroundColor: COLORS.surfaceBorder, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder, justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.spacing_xxl },
  footerText: { color: COLORS.textSecondary, fontSize: SIZES.md },
  footerLink: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '700' },
});
