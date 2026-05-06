import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingWrapper from '../../src/components/OnboardingWrapper';
import CategoryChip from '../../src/components/CategoryChip';
import { ONBOARDING_CHALLENGES } from '../../src/constants/data';
import { COLORS } from '../../src/constants/theme';
import { onboardingAPI } from '../../src/services/api';

export default function ChallengesScreen() {
  const [selected, setSelected] = useState([]);

  const toggle = (item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleComplete = async () => {
    try {
      const profileId = await AsyncStorage.getItem('activeProfileId');
      // Gather all onboarding data from previous screens stored temporarily
      const profession = await AsyncStorage.getItem('onboarding_profession') || '';
      const familyRole = await AsyncStorage.getItem('onboarding_familyRole') || '';
      const field = await AsyncStorage.getItem('onboarding_field') || '';
      const interests = JSON.parse(await AsyncStorage.getItem('onboarding_interests') || '[]');

      await onboardingAPI.save(profileId, {
        profession, familyRole, field, interests, challenges: selected,
      });

      // Clean up temp storage
      await AsyncStorage.multiRemove(['onboarding_profession', 'onboarding_familyRole', 'onboarding_field', 'onboarding_interests']);

      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Error', err.message);
      router.replace('/(tabs)/home');
    }
  };

  return (
    <OnboardingWrapper
      step={5} title="What challenges are you facing?"
      subtitle={`We'll recommend content to help you (${selected.length} selected)`}
      onNext={handleComplete}
      onBack={() => router.back()}
      nextLabel="Complete" isLast nextDisabled={selected.length === 0}
    >
      {ONBOARDING_CHALLENGES.map((c) => (
        <CategoryChip key={c} label={c} selected={selected.includes(c)} onPress={() => toggle(c)} color={COLORS.gold} />
      ))}
    </OnboardingWrapper>
  );
}
