import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onAccept: () => void;
};

export function AIPrivacyConsentModal({ visible, onCancel, onAccept }: Props) {
  const colors = useColors();
  const [checked, setChecked] = useState(false);

  const cancel = () => {
    setChecked(false);
    onCancel();
  };

  const accept = () => {
    if (!checked) return;
    setChecked(false);
    onAccept();
  };

  return (
    <Modal animationType="slide" onRequestClose={cancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
              <Feather color={colors.primary} name="shield" size={25} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Uso de inteligencia artificial</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              La función de inteligencia artificial enviará a Google Gemini únicamente los datos
              médicos que selecciones para realizar la operación solicitada.{'\n\n'}
              Durante esta operación, la información seleccionada saldrá temporalmente de tu
              dispositivo y será procesada por un servicio externo.{'\n\n'}
              MedPocket no almacena tus datos médicos en servidores propios. La inteligencia
              artificial es opcional y puedes utilizar el resto de la aplicación sin activarla.
              {'\n\n'}
              Los resultados pueden contener errores. Esta función no proporciona diagnósticos ni
              sustituye la valoración de un profesional sanitario.
            </Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => setChecked((value) => !value)}
              style={[styles.checkboxRow, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: checked ? colors.primary : colors.border },
                  checked && { backgroundColor: colors.primary },
                ]}>
                {checked ? <Feather color="#FFFFFF" name="check" size={15} /> : null}
              </View>
              <Text style={[styles.checkboxText, { color: colors.text }]}>
                Autorizo el envío y tratamiento de los datos médicos que seleccione mediante Google
                Gemini para realizar la operación solicitada.
              </Text>
            </Pressable>
          </ScrollView>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <Pressable onPress={cancel} style={[styles.button, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              disabled={!checked}
              onPress={accept}
              style={[
                styles.button,
                { backgroundColor: checked ? colors.primary : colors.muted },
              ]}>
              <Text
                style={[
                  styles.acceptText,
                  { color: checked ? '#FFFFFF' : colors.mutedForeground },
                ]}>
                Aceptar y continuar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(15,23,42,0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  content: { padding: 22 },
  icon: { alignItems: 'center', borderRadius: 16, height: 52, justifyContent: 'center', width: 52 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 15 },
  body: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  checkboxRow: {
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    marginTop: 19,
    padding: 14,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    height: 23,
    justifyContent: 'center',
    width: 23,
  },
  checkboxText: { flex: 1, fontSize: 12, lineHeight: 18 },
  actions: { borderTopWidth: 1, flexDirection: 'row', gap: 10, padding: 16 },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  cancelText: { fontSize: 14, fontWeight: '700' },
  acceptText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
