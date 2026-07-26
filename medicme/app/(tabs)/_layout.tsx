import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { useColors } from '@/hooks/use-colors';

export default function TabLayout() {
  const colors = useColors();

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
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Feather color={color} name="home" size={22} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Exámenes',
          tabBarIcon: ({ color }) => <Feather color={color} name="clipboard" size={22} />,
        }}
      />
      <Tabs.Screen
        name="values"
        options={{
          title: 'Valores',
          tabBarIcon: ({ color }) => <Feather color={color} name="activity" size={22} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Citas',
          tabBarIcon: ({ color }) => <Feather color={color} name="calendar" size={22} />,
        }}
      />
      <Tabs.Screen name="perfil" options={{ href: null }} />
    </Tabs>
  );
}
