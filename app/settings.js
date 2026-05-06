import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../src/constants/theme';
import { clearAllDownloads, listDownloads } from '../src/services/downloads';
import { useAuth } from '../src/context/AuthContext';

const SETTINGS_KEY = 'app_settings_v1';
const LANGUAGES = ['English', 'Urdu'];
const VIDEO_QUALITIES = ['Auto', '720p', '480p', '360p'];
const AUDIO_QUALITIES = ['High', 'Medium', 'Low'];
const DOWNLOAD_QUALITIES = ['Standard', 'Low', 'High'];

export default function SettingsScreen() {
  const { user } = useAuth();
  const [toggles, setToggles] = useState({ notif: true, autoplay: true });
  const [language, setLanguage] = useState('English');
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [audioQuality, setAudioQuality] = useState('High');
  const [downloadQuality, setDownloadQuality] = useState('Standard');
  const [cacheSizeText, setCacheSizeText] = useState('0 MB');

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.toggles) setToggles(parsed.toggles);
          if (parsed?.language) setLanguage(parsed.language);
          if (parsed?.videoQuality) setVideoQuality(parsed.videoQuality);
          if (parsed?.audioQuality) setAudioQuality(parsed.audioQuality);
          if (parsed?.downloadQuality) setDownloadQuality(parsed.downloadQuality);
        }
      } catch {}
      try {
        const downloads = await listDownloads();
        const bytes = downloads.reduce((sum, d) => sum + Number(d.bytes || 0), 0);
        const mb = bytes / (1024 * 1024);
        setCacheSizeText(`${mb.toFixed(1)} MB`);
      } catch {
        setCacheSizeText('0 MB');
      }
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ toggles, language, videoQuality, audioQuality, downloadQuality })
    ).catch(() => {});
  }, [toggles, language, videoQuality, audioQuality, downloadQuality]);

  const openChoice = (title, options, onPick) => {
    Alert.alert(
      title,
      'Choose one option',
      [
        ...options.map((o) => ({ text: o, onPress: () => onPick(o) })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNavPress = async (item) => {
    if (item.route) return router.push(item.route);
    switch (item.label) {
      case 'Edit Profile':
        return router.push('/profile/manage');
      case 'Change Password':
        return router.push('/forgot-password');
      case 'Language':
        return openChoice('Language', LANGUAGES, setLanguage);
      case 'Video Quality':
        return openChoice('Video Quality', VIDEO_QUALITIES, setVideoQuality);
      case 'Audio Quality':
        return openChoice('Audio Quality', AUDIO_QUALITIES, setAudioQuality);
      case 'Download Quality':
        return openChoice('Download Quality', DOWNLOAD_QUALITIES, setDownloadQuality);
      case 'Clear Cache':
        return Alert.alert('Clear cache', 'This will remove downloaded files and temp app data.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearAllDownloads();
                await AsyncStorage.multiRemove([
                  'onboarding_profession',
                  'onboarding_familyRole',
                  'onboarding_field',
                  'onboarding_interests',
                ]);
                setCacheSizeText('0 MB');
                Alert.alert('Done', 'Cache cleared successfully.');
              } catch (e) {
                Alert.alert('Error', e.message || 'Could not clear cache');
              }
            },
          },
        ]);
      case 'Terms of Service':
        return Linking.openURL('https://www.youtube.com/t/terms');
      case 'Privacy Policy':
        return Linking.openURL('https://policies.google.com/privacy');
      default:
        return Alert.alert('Coming soon', `${item.label} will be expanded in next update.`);
    }
  };

  const settingsSections = useMemo(() => ([
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', type: 'nav' },
        { icon: 'key-outline', label: 'Change Password', type: 'nav' },
        { icon: 'mail-outline', label: 'Email', value: user?.email || '-', type: 'info' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'heart-outline', label: 'Update Interests', type: 'nav', route: '/onboarding/interests' },
        { icon: 'language-outline', label: 'Language', value: language, type: 'nav' },
        { icon: 'notifications-outline', label: 'Notifications', type: 'toggle', key: 'notif' },
      ],
    },
    {
      title: 'Playback',
      items: [
        { icon: 'videocam-outline', label: 'Video Quality', value: videoQuality, type: 'nav' },
        { icon: 'musical-note-outline', label: 'Audio Quality', value: audioQuality, type: 'nav' },
        { icon: 'play-outline', label: 'Auto-play Next', type: 'toggle', key: 'autoplay' },
      ],
    },
    {
      title: 'Storage',
      items: [
        { icon: 'download-outline', label: 'Download Quality', value: downloadQuality, type: 'nav' },
        { icon: 'trash-outline', label: 'Clear Cache', value: cacheSizeText, type: 'nav' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'Version', value: '1.0.0', type: 'info' },
        { icon: 'document-text-outline', label: 'Terms of Service', type: 'nav' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', type: 'nav' },
      ],
    },
  ]), [user?.email, language, videoQuality, audioQuality, downloadQuality, cacheSizeText]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.item}
                onPress={item.type === 'nav' ? () => handleNavPress(item) : undefined}
                activeOpacity={item.type === 'toggle' || item.type === 'info' ? 1 : 0.7}
              >
                <Ionicons name={item.icon} size={20} color={COLORS.textSecondary} />
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.type === 'nav' && (
                  <View style={styles.itemRight}>
                    {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                  </View>
                )}
                {item.type === 'info' && item.value && (
                  <Text style={styles.itemValue}>{item.value}</Text>
                )}
                {item.type === 'toggle' && (
                  <Switch
                    value={toggles[item.key]}
                    onValueChange={(v) => setToggles((prev) => ({ ...prev, [item.key]: v }))}
                    trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary + '60' }}
                    thumbColor={toggles[item.key] ? COLORS.primary : COLORS.textMuted}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing_base, paddingVertical: SIZES.spacing_md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  scroll: { paddingHorizontal: SIZES.spacing_base },
  section: { marginBottom: SIZES.spacing_xl },
  sectionTitle: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: SIZES.spacing_sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.surfaceBorder },
  itemLabel: { color: COLORS.textPrimary, fontSize: SIZES.base, flex: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemValue: { color: COLORS.textMuted, fontSize: SIZES.sm },
});
