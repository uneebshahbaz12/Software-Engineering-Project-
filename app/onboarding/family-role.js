import React, { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingWrapper from '../../src/components/OnboardingWrapper';
import CategoryChip from '../../src/components/CategoryChip';
import { ONBOARDING_FAMILY_ROLES } from '../../src/constants/data';

export default function FamilyRoleScreen() {
  const [selected, setSelected] = useState('');
  return (
    <OnboardingWrapper
      step={2} title="What's your role in the family?"
      subtitle="We'll recommend relevant family content"
      onNext={async () => { await AsyncStorage.setItem('onboarding_familyRole', selected); router.push('/onboarding/field'); }}
      onBack={() => router.back()} nextDisabled={!selected}
    >
      {ONBOARDING_FAMILY_ROLES.map((r) => (
        <CategoryChip key={r} label={r} selected={selected === r} onPress={() => setSelected(r)} />
      ))}
    </OnboardingWrapper>
  );
}
