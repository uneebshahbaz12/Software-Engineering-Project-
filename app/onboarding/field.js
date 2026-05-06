import React, { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingWrapper from '../../src/components/OnboardingWrapper';
import CategoryChip from '../../src/components/CategoryChip';
import { ONBOARDING_FIELDS } from '../../src/constants/data';

export default function FieldScreen() {
  const [selected, setSelected] = useState('');
  return (
    <OnboardingWrapper
      step={3} title="What's your field?"
      subtitle="Select your area of study or work"
      onNext={async () => { await AsyncStorage.setItem('onboarding_field', selected); router.push('/onboarding/interests'); }}
      onBack={() => router.back()} nextDisabled={!selected}
    >
      {ONBOARDING_FIELDS.map((f) => (
        <CategoryChip key={f} label={f} selected={selected === f} onPress={() => setSelected(f)} />
      ))}
    </OnboardingWrapper>
  );
}
