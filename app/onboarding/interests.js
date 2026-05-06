import React, { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingWrapper from '../../src/components/OnboardingWrapper';
import CategoryChip from '../../src/components/CategoryChip';
import { ONBOARDING_INTERESTS } from '../../src/constants/data';

export default function InterestsScreen() {
  const [selected, setSelected] = useState([]);

  const toggle = (item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <OnboardingWrapper
      step={4} title="Select your interests"
      subtitle={`Choose topics you'd like to explore (${selected.length} selected)`}
      onNext={async () => { await AsyncStorage.setItem('onboarding_interests', JSON.stringify(selected)); router.push('/onboarding/challenges'); }}
      onBack={() => router.back()} nextDisabled={selected.length === 0}
    >
      {ONBOARDING_INTERESTS.map((t) => (
        <CategoryChip key={t} label={t} selected={selected.includes(t)} onPress={() => toggle(t)} />
      ))}
    </OnboardingWrapper>
  );
}
