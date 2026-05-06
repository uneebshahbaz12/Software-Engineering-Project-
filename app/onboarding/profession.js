import React, { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingWrapper from '../../src/components/OnboardingWrapper';
import CategoryChip from '../../src/components/CategoryChip';
import { ONBOARDING_PROFESSIONS } from '../../src/constants/data';

export default function ProfessionScreen() {
  const [selected, setSelected] = useState('');
  return (
    <OnboardingWrapper
      step={1} title="What's your profession?"
      subtitle="This helps us personalize your experience"
      onNext={async () => { await AsyncStorage.setItem('onboarding_profession', selected); router.push('/onboarding/family-role'); }}
      showBack={false} nextDisabled={!selected}
    >
      {ONBOARDING_PROFESSIONS.map((p) => (
        <CategoryChip key={p} label={p} selected={selected === p} onPress={() => setSelected(p)} />
      ))}
    </OnboardingWrapper>
  );
}
