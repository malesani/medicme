import { Stack, router, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { ProfileProvider, useProfile } from '@/context/profile-context';
import { useColors } from '@/hooks/use-colors';

export default function RootLayout() {
  return (
    <ProfileProvider>
      <RootNavigator />
    </ProfileProvider>
  );
}

function RootNavigator() {
  const colors = useColors();
  const segments = useSegments();
  const { profile, ready } = useProfile();

  useEffect(() => {
    if (!ready) return;
    const isOnboarding = segments[0] === 'onboarding';
    if (!profile && !isOnboarding) router.replace('/onboarding');
    if (profile && isOnboarding) router.replace('/');
  }, [profile, ready, segments]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Image source={require('../assets/images/medpocket-icon.png')} style={styles.logo} />
        <Text style={[styles.brand, { color: colors.text }]}>MedPocket</Text>
        <ActivityIndicator color={colors.primary} size="small" style={styles.indicator} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logo: { height: 120, resizeMode: 'contain', width: 120 },
  brand: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  indicator: { marginTop: 22 },
});
