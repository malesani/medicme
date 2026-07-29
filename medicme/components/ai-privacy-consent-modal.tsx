import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { useLanguage } from '@/context/language-context';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onAccept: () => void;
};

export function AIPrivacyConsentModal({ visible, onCancel, onAccept }: Props) {
  const colors = useColors();
  const { tr } = useLanguage();
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
            <Text style={[styles.title, { color: colors.text }]}>{tr('Uso de inteligencia artificial', 'Uso dell’intelligenza artificiale', 'Use of artificial intelligence')}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              {tr(
                'La función de inteligencia artificial enviará a Google Gemini únicamente los datos médicos que selecciones para realizar la operación solicitada.\n\nDurante esta operación, la información seleccionada saldrá temporalmente de tu dispositivo y será procesada por un servicio externo.\n\nMedPocket no almacena tus datos médicos en servidores propios. La inteligencia artificial es opcional y puedes utilizar el resto de la aplicación sin activarla.\n\nLos resultados pueden contener errores. Esta función no proporciona diagnósticos ni sustituye la valoración de un profesional sanitario.',
                'La funzione di intelligenza artificiale invierà a Google Gemini solo i dati medici selezionati per eseguire l’operazione richiesta.\n\nDurante questa operazione, le informazioni selezionate usciranno temporaneamente dal dispositivo e saranno elaborate da un servizio esterno.\n\nMedPocket non archivia i tuoi dati medici su server propri. L’intelligenza artificiale è facoltativa e puoi usare il resto dell’app senza attivarla.\n\nI risultati possono contenere errori. Questa funzione non fornisce diagnosi e non sostituisce la valutazione di un professionista sanitario.',
                'The artificial intelligence feature will send only the medical data you select to Google Gemini to perform the requested operation.\n\nDuring this operation, the selected information will temporarily leave your device and be processed by an external service.\n\nMedPocket does not store your medical data on its own servers. AI is optional and you can use the rest of the app without enabling it.\n\nResults may contain errors. This feature does not provide diagnoses or replace assessment by a healthcare professional.'
              )}
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
                {tr('Autorizo el envío y tratamiento de los datos médicos que seleccione mediante Google Gemini para realizar la operación solicitada.', 'Autorizzo l’invio e il trattamento tramite Google Gemini dei dati medici che seleziono per eseguire l’operazione richiesta.', 'I authorize the selected medical data to be sent to and processed by Google Gemini for the requested operation.')}
              </Text>
            </Pressable>
          </ScrollView>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <Pressable onPress={cancel} style={[styles.button, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.text }]}>{tr('Cancelar', 'Annulla', 'Cancel')}</Text>
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
                {tr('Aceptar y continuar', 'Accetta e continua', 'Accept and continue')}
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
