import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getAIConsent,
  withdrawAIConsent,
  type AIConsentRecord,
} from '@/services/privacy/ai-consent-service';
import { useColors } from '@/hooks/use-colors';
import { useLanguage } from '@/context/language-context';
import { safeLogger } from '@/utils/safe-logger';

export default function PrivacyScreen() {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const [consent, setConsent] = useState<AIConsentRecord | null>(null);

  const load = useCallback(async () => setConsent(await getAIConsent()), []);
  useFocusEffect(useCallback(() => void load(), [load]));

  const withdraw = () => {
    Alert.alert(
      tr('Desactivar inteligencia artificial', 'Disattiva intelligenza artificiale', 'Disable artificial intelligence'),
      tr('Las nuevas solicitudes a Gemini quedarán bloqueadas. Tus datos locales no serán eliminados.', 'Le nuove richieste a Gemini saranno bloccate. I dati locali non verranno eliminati.', 'New requests to Gemini will be blocked. Your local data will not be deleted.'),
      [
        { text: tr('Cancelar', 'Annulla', 'Cancel'), style: 'cancel' },
        {
          text: tr('Desactivar', 'Disattiva', 'Disable'),
          style: 'destructive',
          onPress: async () => {
            setConsent(await withdrawAIConsent());
            safeLogger.info('AI consent withdrawn');
            Alert.alert(
              tr('Inteligencia artificial desactivada', 'Intelligenza artificiale disattivata', 'Artificial intelligence disabled'),
              tr('El uso de inteligencia artificial ha sido desactivado. Tus datos médicos locales no han sido modificados.', 'L’uso dell’intelligenza artificiale è stato disattivato. I dati medici locali non sono stati modificati.', 'Artificial intelligence has been disabled. Your local medical data has not been changed.')
            );
          },
        },
      ]
    );
  };

  const active = Boolean(consent?.accepted && consent.withdrawnAt === null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather color={colors.text} name="arrow-left" size={22} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{tr('Privacidad', 'Privacy', 'Privacy')}</Text>
          <View style={styles.back} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
              <Feather color={colors.primary} name="zap" size={20} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{tr('Inteligencia artificial', 'Intelligenza artificiale', 'Artificial intelligence')}</Text>
              <Text style={[styles.status, { color: active ? colors.secondary : colors.mutedForeground }]}>
                {active ? tr('Consentimiento activo', 'Consenso attivo', 'Consent active') : tr('Desactivada', 'Disattivata', 'Disabled')}
              </Text>
            </View>
          </View>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {tr('Solo los valores que confirmes se envían temporalmente a Google Gemini. MedPocket no dispone de un servidor propio para almacenar tus datos médicos.', 'Solo i valori confermati vengono inviati temporaneamente a Google Gemini. MedPocket non dispone di un server proprio per archiviare i tuoi dati medici.', 'Only values you confirm are temporarily sent to Google Gemini. MedPocket has no server of its own for storing your medical data.')}
          </Text>
          <View style={[styles.detail, { backgroundColor: colors.muted }]}>
            <Text style={[styles.detailText, { color: colors.text }]}>
              {tr('Fecha de aceptación:', 'Data di accettazione:', 'Acceptance date:')}{' '}
              {consent?.acceptedAt ? new Date(consent.acceptedAt).toLocaleDateString(locale) : '—'}
            </Text>
            <Text style={[styles.detailText, { color: colors.text }]}>
              {tr('Versión aceptada:', 'Versione accettata:', 'Accepted version:')} {consent?.consentVersion ?? '—'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/privacy-policy')}
            style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Feather color={colors.primary} name="file-text" size={17} />
            <Text style={[styles.secondaryText, { color: colors.primary }]}>
              {tr('Leer la política de privacidad', 'Leggi l’informativa sulla privacy', 'Read the privacy policy')}
            </Text>
          </Pressable>
          {active ? (
            <Pressable
              onPress={withdraw}
              style={[styles.dangerButton, { borderColor: colors.destructive }]}>
              <Text style={[styles.dangerText, { color: colors.destructive }]}>
                {tr('Desactivar inteligencia artificial', 'Disattiva intelligenza artificiale', 'Disable artificial intelligence')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: Platform.OS === 'web' ? 24 : 54 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { fontSize: 19, fontWeight: '800' },
  card: { borderRadius: 18, borderWidth: 1, marginTop: 25, padding: 18 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  copy: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  status: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  body: { fontSize: 13, lineHeight: 20, marginTop: 15 },
  detail: { borderRadius: 11, gap: 6, marginTop: 14, padding: 12 },
  detailText: { fontSize: 12 },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 15,
    padding: 13,
  },
  secondaryText: { fontSize: 13, fontWeight: '700' },
  dangerButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    padding: 13,
  },
  dangerText: { fontSize: 13, fontWeight: '800' },
});
