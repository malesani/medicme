import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SanitizedMedicalValue } from '@/services/privacy/medical-data-sanitizer';
import { useColors } from '@/hooks/use-colors';

type Props = {
  visible: boolean;
  values: SanitizedMedicalValue[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function AIDataPreviewModal({ visible, values, onCancel, onConfirm }: Props) {
  const colors = useColors();

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
              <Feather color={colors.primary} name="send" size={21} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]}>Datos que se enviarán a Gemini</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Revisa y confirma el contenido de esta solicitud.
              </Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {values.map((value, index) => (
              <View
                key={`${value.indicator}-${index}`}
                style={[styles.valueCard, { backgroundColor: colors.muted }]}>
                <Text style={[styles.indicator, { color: colors.text }]}>
                  {value.indicator.replaceAll('_', ' ')}
                </Text>
                <Text style={[styles.value, { color: colors.primary }]}>
                  {value.value} {value.unit}
                </Text>
                <Text style={[styles.range, { color: colors.mutedForeground }]}>
                  Rango: {value.referenceRange.min ?? '—'}–{value.referenceRange.max ?? '—'}{' '}
                  {value.unit}
                </Text>
              </View>
            ))}
            <Text style={[styles.notice, { color: colors.mutedForeground }]}>
              No se enviarán tu nombre, datos de contacto, identificadores, rutas de archivos ni el
              resto de tu historial.
            </Text>
          </ScrollView>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <Pressable onPress={onCancel} style={[styles.button, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={styles.confirmText}>Enviar a Gemini</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(15,23,42,0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 20 },
  icon: { alignItems: 'center', borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  headerCopy: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 3 },
  list: { gap: 9, paddingBottom: 18, paddingHorizontal: 20 },
  valueCard: { borderRadius: 12, padding: 13 },
  indicator: { fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  value: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  range: { fontSize: 11, marginTop: 4 },
  notice: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  actions: { borderTopWidth: 1, flexDirection: 'row', gap: 10, padding: 16 },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelText: { fontSize: 14, fontWeight: '700' },
  confirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
