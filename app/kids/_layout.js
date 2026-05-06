import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/theme';

export default function KidsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    />
  );
}
