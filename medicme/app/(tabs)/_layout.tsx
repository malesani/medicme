import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useColors } from '@/hooks/use-colors';
import { useLanguage } from '@/context/language-context';

export default function TabLayout() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <Feather color={color} name="home" size={22} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: t('exams'),
          tabBarIcon: ({ color }) => <Feather color={color} name="clipboard" size={22} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: t('analysis'),
          tabBarIcon: () => (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.primary,
                borderColor: colors.card,
                borderRadius: 30,
                borderWidth: 4,
                height: 58,
                justifyContent: 'center',
                marginBottom: 16,
                width: 58,
              }}>
              <Image
                source={require('../../assets/images/medpocket-icon.png')}
                style={{ borderRadius: 18, height: 38, width: 38 }}
              />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
        }}
      />
      <Tabs.Screen
        name="values"
        options={{
          title: t('values'),
          tabBarIcon: ({ color }) => <Feather color={color} name="activity" size={22} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('appointments'),
          tabBarIcon: ({ color }) => <Feather color={color} name="calendar" size={22} />,
        }}
      />
      <Tabs.Screen name="perfil" options={{ href: null }} />
    </Tabs>
  );
}
