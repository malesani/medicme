import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { useProfile } from '@/context/profile-context';
import { useAppTheme } from '@/context/theme-context';

const settings = [
  { icon: 'download' as const, label: 'Exportar mis datos', detail: 'PDF y copia local' },
  { icon: 'database' as const, label: 'Copia de seguridad', detail: 'Solo en este dispositivo' },
  { icon: 'shield' as const, label: 'Privacidad y seguridad', detail: 'PIN y biometría' },
  { icon: 'file-text' as const, label: 'Política de privacidad', detail: '' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { theme, toggleTheme } = useAppTheme();
  const { profile } = useProfile();
  const initials = `${profile?.first_name.charAt(0) ?? ''}${profile?.last_name.charAt(0) ?? ''}`.toUpperCase();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather color={colors.text} name="arrow-left" size={20} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.initials, { color: colors.primary }]}>{initials || 'MP'}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ')}
          </Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>
            Tus datos médicos permanecen en el dispositivo
          </Text>
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Peso</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {profile?.height_cm ? `${profile.height_cm} cm` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Altura</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferencias</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather color={colors.primary} name="bell" size={18} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Notificaciones</Text>
              <Text style={[styles.settingDetail, { color: colors.mutedForeground }]}>
                Recordatorios de citas
              </Text>
            </View>
            <Switch trackColor={{ false: colors.border, true: colors.primary }} value />
          </View>
          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
              <Feather
                color={colors.primary}
                name={theme === 'dark' ? 'moon' : 'sun'}
                size={18}
              />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Modo oscuro</Text>
              <Text style={[styles.settingDetail, { color: colors.mutedForeground }]}>
                {theme === 'dark' ? 'Activado' : 'Desactivado'}
              </Text>
            </View>
            <Switch
              onValueChange={() => void toggleTheme()}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.border, true: colors.primary }}
              value={theme === 'dark'}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos y seguridad</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {settings.map((setting, index) => (
            <Pressable
              key={setting.label}
              onPress={
                setting.label === 'Privacidad y seguridad'
                  ? () => router.push('/privacy')
                  : setting.label === 'Política de privacidad'
                    ? () => router.push('/privacy-policy')
                    : undefined
              }
              style={[
                styles.settingRow,
                index < settings.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}>
              <View style={[styles.settingIcon, { backgroundColor: colors.muted }]}>
                <Feather color={colors.mutedForeground} name={setting.icon} size={18} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{setting.label}</Text>
                {setting.detail ? (
                  <Text style={[styles.settingDetail, { color: colors.mutedForeground }]}>
                    {setting.detail}
                  </Text>
                ) : null}
              </View>
              <Feather color={colors.mutedForeground} name="chevron-right" size={18} />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>MedPocket · versión 1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 54,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  back: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  identity: { alignItems: 'center', marginTop: 28 },
  avatar: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 13,
    width: 80,
  },
  initials: { fontSize: 25, fontWeight: '800' },
  name: { fontSize: 23, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 5, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 24 },
  stat: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 15,
  },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 26 },
  group: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 14 },
  settingDivider: { height: 1, marginLeft: 64 },
  settingIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingCopy: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingDetail: { fontSize: 12 },
  version: { fontSize: 12, marginTop: 28, textAlign: 'center' },
});
