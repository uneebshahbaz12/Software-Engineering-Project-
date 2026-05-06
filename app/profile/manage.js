import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SIZES } from '../../src/constants/theme';
import GlowButton from '../../src/components/GlowButton';
import { profileAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

const avatarColors = [COLORS.primary, COLORS.accent1, COLORS.accent2, COLORS.accent4, COLORS.gold, COLORS.accent3];

export default function ManageProfileScreen() {
  const { profiles, setProfiles, activeProfile, switchProfile } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isKidsProfile, setIsKidsProfile] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS.primary);
  const [loading, setLoading] = useState(false);

  const profileCount = profiles?.length || 0;
  const canAddMore = profileCount < 5;
  const sortedProfiles = useMemo(() => (profiles || []).slice(), [profiles]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await profileAPI.getAll();
        setProfiles(res.data || []);
      } catch (e) {
        // keep current list (if any)
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setProfiles]);

  const addProfile = async () => {
    if (!newName.trim() || !canAddMore) return;
    setLoading(true);
    try {
      const res = await profileAPI.create({
        name: newName.trim(),
        color: selectedColor,
        pin: newPin.length === 4 ? newPin : undefined,
        isKids: isKidsProfile,
      });
      const created = res.data;
      const next = [...(profiles || []), created];
      setProfiles(next);
      if (!activeProfile) await switchProfile(created);
      setNewName('');
      setNewPin('');
      setIsKidsProfile(false);
      setShowAdd(false);
    } catch (e) {
      // ignore for now (could show toast)
    } finally {
      setLoading(false);
    }
  };

  const openEditProfile = (profile) => {
    setEditingProfileId(profile.id);
    setNewName(profile.name || '');
    setNewPin('');
    setIsKidsProfile(!!profile.is_kids);
    setSelectedColor(profile.color || COLORS.primary);
    setShowEdit(true);
  };

  const saveEditProfile = async () => {
    if (!editingProfileId || !newName.trim()) return;
    setLoading(true);
    try {
      const res = await profileAPI.update(editingProfileId, {
        name: newName.trim(),
        color: selectedColor,
        pin: newPin.length === 4 ? newPin : undefined,
        isKids: isKidsProfile,
      });
      const updated = res?.data;
      const next = (profiles || []).map((p) => (p.id === editingProfileId ? { ...p, ...updated } : p));
      setProfiles(next);
      if (activeProfile?.id === editingProfileId && updated) {
        await switchProfile({ ...activeProfile, ...updated });
      }
      setShowEdit(false);
      setEditingProfileId(null);
      setNewName('');
      setNewPin('');
      setIsKidsProfile(false);
    } catch (e) {
      // ignore for now (could show toast)
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (id) => {
    setLoading(true);
    try {
      await profileAPI.remove(id);
      const next = (profiles || []).filter((p) => p.id !== id);
      setProfiles(next);
      if (activeProfile?.id === id) {
        const fallback = next[0] || null;
        if (fallback) await switchProfile(fallback);
      }
    } catch (e) {
      // ignore for now (could show toast)
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Profiles</Text>
        <Text style={styles.count}>{profileCount}/5</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {sortedProfiles.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(i * 80).duration(400)}>
            <View style={styles.profileCard}>
              <View style={[styles.avatar, { backgroundColor: p.color + '20', borderColor: p.color }]}>
                {p.is_kids ? (
                  <Ionicons name="happy" size={28} color={p.color} />
                ) : (
                  <Text style={[styles.avatarText, { color: p.color }]}>{p.name[0]}</Text>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{p.name}</Text>
                <View style={styles.badges}>
                  {!!p.pin && (
                    <View style={styles.badge}>
                      <Ionicons name="lock-closed" size={10} color={COLORS.primary} />
                      <Text style={styles.badgeText}>PIN</Text>
                    </View>
                  )}
                  {p.is_kids && (
                    <View style={[styles.badge, { borderColor: COLORS.accent4 }]}>
                      <Ionicons name="happy" size={10} color={COLORS.accent4} />
                      <Text style={[styles.badgeText, { color: COLORS.accent4 }]}>Kids</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditProfile(p)} disabled={loading}>
                  <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteProfile(p.id)} disabled={loading}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ))}

        {canAddMore && (
          <TouchableOpacity style={styles.addCard} onPress={() => setShowAdd(true)} disabled={loading}>
            <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
            <Text style={styles.addText}>Add New Profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Profile Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Profile</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Avatar Color */}
            <Text style={styles.modalLabel}>Avatar Color</Text>
            <View style={styles.colorRow}>
              {avatarColors.map((c, idx) => (
                <TouchableOpacity key={`color-${idx}`} onPress={() => setSelectedColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorSelected]} />
              ))}
            </View>

            {/* Name */}
            <Text style={styles.modalLabel}>Profile Name</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Enter name"
              placeholderTextColor={COLORS.textMuted} style={styles.modalInput} />

            {/* PIN */}
            <Text style={styles.modalLabel}>PIN (optional, 4 digits)</Text>
            <TextInput value={newPin} onChangeText={(v) => v.length <= 4 && setNewPin(v)}
              placeholder="Set a PIN" placeholderTextColor={COLORS.textMuted}
              style={styles.modalInput} keyboardType="numeric" secureTextEntry maxLength={4} />

            {/* Kids toggle */}
            <TouchableOpacity style={styles.kidsToggle} onPress={() => setIsKidsProfile(!isKidsProfile)}>
              <Ionicons name={isKidsProfile ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              <Text style={styles.kidsText}>This is a Kids Profile</Text>
            </TouchableOpacity>

            <GlowButton title="Create Profile" onPress={addProfile} disabled={!newName.trim()} style={{ marginTop: 20 }} />
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEdit(false);
                  setEditingProfileId(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Avatar Color</Text>
            <View style={styles.colorRow}>
              {avatarColors.map((c) => (
                <TouchableOpacity
                  key={'edit-' + c}
                  onPress={() => setSelectedColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorSelected]}
                />
              ))}
            </View>

            <Text style={styles.modalLabel}>Profile Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name"
              placeholderTextColor={COLORS.textMuted}
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>New PIN (optional, 4 digits)</Text>
            <TextInput
              value={newPin}
              onChangeText={(v) => v.length <= 4 && setNewPin(v)}
              placeholder="Leave empty to keep current PIN"
              placeholderTextColor={COLORS.textMuted}
              style={styles.modalInput}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />

            <TouchableOpacity style={styles.kidsToggle} onPress={() => setIsKidsProfile(!isKidsProfile)}>
              <Ionicons name={isKidsProfile ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              <Text style={styles.kidsText}>This is a Kids Profile</Text>
            </TouchableOpacity>

            <GlowButton
              title="Save Changes"
              onPress={saveEditProfile}
              disabled={!newName.trim() || loading}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  count: { color: COLORS.textMuted, fontSize: SIZES.sm },
  scroll: { padding: SIZES.spacing_base, gap: 12 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_lg,
    padding: SIZES.spacing_base, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  avatarText: { fontSize: SIZES.xl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: COLORS.textPrimary, fontSize: SIZES.base, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: COLORS.primary, fontSize: 9, fontWeight: '700' },
  profileActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  addCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 20, borderRadius: SIZES.radius_lg,
    borderWidth: 1.5, borderColor: COLORS.primary + '40', borderStyle: 'dashed',
  },
  addText: { color: COLORS.primary, fontSize: SIZES.base, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.spacing_xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800' },
  modalLabel: { color: COLORS.textSecondary, fontSize: SIZES.sm, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  modalInput: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius_md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SIZES.spacing_base, height: SIZES.inputHeight, color: COLORS.textPrimary, fontSize: SIZES.base,
  },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: '#FFF' },
  kidsToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  kidsText: { color: COLORS.textPrimary, fontSize: SIZES.base },
});
