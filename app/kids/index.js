import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Switch, Dimensions, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import GlowButton from '../../src/components/GlowButton';
import ContentCard from '../../src/components/ContentCard';
import { KIDS_CATEGORIES, KIDS_CONTENT } from '../../src/constants/data';
import { profileAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function KidsScreen() {
  const { activeProfile, setProfiles } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [showParental, setShowParental] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinAction, setPinAction] = useState('parental');
  const pinInputRef = useRef(null);

  // Focus the PIN input whenever the modal opens
  useEffect(() => {
    if (showPinModal) {
      // Small delay to let the Modal animate in before focusing
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [showPinModal]);
  const defaultEnabled = useMemo(
    () => KIDS_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.id]: true }), {}),
    []
  );
  const [enabledCategories, setEnabledCategories] = useState(defaultEnabled);

  useEffect(() => {
    const load = async () => {
      if (!activeProfile?.id) return;
      setLoading(true);
      try {
        const res = await profileAPI.getAll();
        const list = res.data || [];
        setProfiles(list);
        const current = list.find((p) => p.id === activeProfile.id);
        const enabled = current?.enabled_categories;
        if (Array.isArray(enabled) && enabled.length > 0) {
          const next = KIDS_CATEGORIES.reduce(
            (acc, c) => ({ ...acc, [c.id]: enabled.includes(String(c.id)) }),
            {}
          );
          setEnabledCategories(next);
        } else {
          setEnabledCategories(defaultEnabled);
        }
      } catch (e) {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeProfile?.id, defaultEnabled, setProfiles]);

  const handleExitKids = () => {
    setPinAction('exit');
    setShowPinModal(true);
  };

  const verifyPinAnd = async (onSuccess) => {
    if (!activeProfile?.id) {
      Alert.alert('No active profile', 'Please select a profile first.');
      return;
    }
    setLoading(true);
    try {
      const res = await profileAPI.verifyPin(activeProfile.id, pin);
      const msg = res?.message || '';
      if (/incorrect/i.test(msg)) {
        Alert.alert('Incorrect PIN', 'Please try again.');
        return;
      }
      setShowPinModal(false);
      setPin('');
      onSuccess?.();
    } catch (e) {
      Alert.alert('PIN verification failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParentalAccess = () => {
    verifyPinAnd(() => setShowParental(true));
  };

  const handleExit = () => {
    verifyPinAnd(() => router.back());
  };

  const saveParentalControls = async () => {
    if (!activeProfile?.id) return;
    setLoading(true);
    try {
      const enabledIds = KIDS_CATEGORIES.filter((c) => enabledCategories[c.id]).map((c) => String(c.id));
      await profileAPI.update(activeProfile.id, { enabledCategories: enabledIds });
      setShowParental(false);
      Alert.alert('Saved', 'Kids settings updated.');
    } catch (e) {
      Alert.alert('Save failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0a2e', '#16213e', '#0a1628']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.primary }}>Islam </Text>
            <Text style={{ color: COLORS.primaryDark }}>Learning Platform </Text>
            <Text style={{ color: COLORS.accent3 }}>Kids</Text>
          </Text>
        </View>

        {showParental ? (
          /* Parental Controls */
          <View style={styles.parentalContainer}>
            <Text style={styles.parentalTitle}>Parental Controls</Text>
            <Text style={styles.parentalDesc}>Toggle categories visible to kids</Text>
            {KIDS_CATEGORIES.map((c) => (
              <View key={c.id} style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <View style={[styles.toggleIcon, { backgroundColor: c.color + '20' }]}>
                    <Ionicons name="star" size={16} color={c.color} />
                  </View>
                  <Text style={styles.toggleLabel}>{c.name}</Text>
                </View>
                <Switch
                  value={enabledCategories[c.id]}
                  onValueChange={(v) => setEnabledCategories((prev) => ({ ...prev, [c.id]: v }))}
                  trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary + '60' }}
                  thumbColor={enabledCategories[c.id] ? COLORS.primary : COLORS.textMuted}
                />
              </View>
            ))}
            <GlowButton title={loading ? 'Saving...' : 'Save & Back to Kids'} onPress={saveParentalControls} style={{ marginTop: 20 }} />
          </View>
        ) : (
          /* Kids Categories Grid */
          <View style={styles.categoriesGrid}>
            {KIDS_CATEGORIES.filter((c) => enabledCategories[c.id]).map((cat, i) => (
              <Animated.View key={cat.id} entering={FadeInDown.delay(i * 100).duration(500)}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: `/kids/${cat.id}`, params: { name: cat.name } })}
                >
                  <LinearGradient
                    colors={[cat.color + '40', cat.color + '20']}
                    style={styles.categoryCard}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: cat.color + '40' }]}>
                      <Ionicons name="star" size={32} color={cat.color} />
                    </View>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Bottom buttons */}
        {!showParental && (
          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.exitBtn} onPress={handleExitKids}>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
              <Text style={styles.exitText}>Exit Kids Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.parentalBtn}
              onPress={() => {
                setPinAction('parental');
                setShowPinModal(true);
              }}
            >
              <Ionicons name="settings" size={16} color={COLORS.textMuted} />
              <Text style={styles.exitText}>Parental Controls</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} animationType="fade" transparent>
        <View style={styles.pinOverlay}>
          <View style={styles.pinCard}>
            <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Text style={styles.pinDesc}>Enter your 4-digit parental PIN</Text>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.pinDotsContainer}
              onPress={() => pinInputRef.current?.focus()}
            >
              <View style={styles.pinDots}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                ))}
              </View>
              <TextInput
                ref={pinInputRef}
                value={pin}
                onChangeText={(v) => {
                  const cleaned = v.replace(/[^0-9]/g, '');
                  if (cleaned.length <= 4) setPin(cleaned);
                }}
                keyboardType="number-pad"
                style={styles.pinInput}
                secureTextEntry
                maxLength={4}
                caretHidden
                contextMenuHidden
                selectTextOnFocus={false}
              />
            </TouchableOpacity>
            <View style={styles.pinButtons}>
              <TouchableOpacity onPress={() => { setShowPinModal(false); setPin(''); setPinAction('parental'); }} style={styles.pinCancel}>
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>
              <GlowButton
                title={loading ? 'Verifying...' : 'Verify'}
                onPress={pin.length === 4 ? (pinAction === 'exit' ? handleExit : handleParentalAccess) : undefined}
                disabled={pin.length < 4 || loading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: SIZES.spacing_lg },
  logo: { fontSize: 32, fontWeight: '900' },
  categoriesGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, padding: SIZES.spacing_base },
  categoryCard: {
    width: (width - 56) / 2, height: 140,
    borderRadius: SIZES.radius_xl, justifyContent: 'center', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  categoryName: { color: '#FFF', fontSize: SIZES.base, fontWeight: '700', textAlign: 'center' },
  bottomButtons: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: SIZES.spacing_base },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  parentalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  exitText: { color: COLORS.textMuted, fontSize: SIZES.sm },

  // Parental Controls
  parentalContainer: { flex: 1, paddingHorizontal: SIZES.spacing_xl },
  parentalTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800', marginBottom: 4 },
  parentalDesc: { color: COLORS.textSecondary, fontSize: SIZES.md, marginBottom: SIZES.spacing_lg },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  toggleLabel: { color: COLORS.textPrimary, fontSize: SIZES.base, fontWeight: '500' },

  // PIN Modal
  pinOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  pinCard: { backgroundColor: COLORS.backgroundLight, borderRadius: SIZES.radius_xl, padding: SIZES.spacing_xxl, alignItems: 'center', width: width - 60 },
  pinTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800', marginTop: 16 },
  pinDesc: { color: COLORS.textSecondary, fontSize: SIZES.md, marginTop: 8 },
  pinDotsContainer: { width: '100%', alignItems: 'center', position: 'relative', marginTop: 24 },
  pinDots: { flexDirection: 'row', gap: 16 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.surfaceBorder },
  pinDotFilled: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pinInput: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 50,
    fontSize: 1,
    color: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlign: 'center',
    zIndex: 10,
  },
  pinButtons: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  pinCancel: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  pinCancelText: { color: COLORS.textSecondary, fontSize: SIZES.base, fontWeight: '600' },
});
