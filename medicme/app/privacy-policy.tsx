import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { useLanguage } from '@/context/language-context';

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const { tr } = useLanguage();
  const sections = [
    {
      title: tr('Almacenamiento local', 'Archiviazione locale', 'Local storage'),
      body: tr('Los datos médicos, documentos, citas y valores introducidos en MedPocket se almacenan exclusivamente en el dispositivo. La aplicación no dispone de una base de datos propia para recopilar esta información y el desarrollador no puede acceder a ella.', 'I dati medici, i documenti, gli appuntamenti e i valori inseriti in MedPocket vengono archiviati esclusivamente sul dispositivo. L’app non dispone di un database proprio per raccogliere queste informazioni e lo sviluppatore non può accedervi.', 'Medical data, documents, appointments and values entered in MedPocket are stored only on the device. The app has no database of its own to collect this information and the developer cannot access it.'),
    },
    {
      title: tr('Uso de inteligencia artificial', 'Uso dell’intelligenza artificiale', 'Use of artificial intelligence'),
      body: tr('Cuando activas voluntariamente una función de inteligencia artificial, los datos seleccionados pueden enviarse temporalmente a Google Gemini para realizar la operación solicitada. Antes de cada solicitud se muestra la información que será enviada. Esta función es opcional y puede desactivarse desde Privacidad.', 'Quando attivi volontariamente una funzione di intelligenza artificiale, i dati selezionati possono essere inviati temporaneamente a Google Gemini per eseguire l’operazione richiesta. Prima di ogni richiesta vengono mostrate le informazioni da inviare. La funzione è facoltativa e può essere disattivata dalla sezione Privacy.', 'When you voluntarily enable an AI feature, selected data may be temporarily sent to Google Gemini to perform the requested operation. The information to be sent is shown before every request. This feature is optional and can be disabled under Privacy.'),
    },
    {
      title: tr('Minimización de datos', 'Minimizzazione dei dati', 'Data minimization'),
      body: tr('MedPocket envía solamente la información necesaria para completar la solicitud y excluye nombres, datos de contacto, identificadores internos, rutas y nombres de archivos cuando no son necesarios.', 'MedPocket invia solo le informazioni necessarie per completare la richiesta ed esclude nomi, contatti, identificatori interni, percorsi e nomi dei file quando non sono necessari.', 'MedPocket sends only the information required to complete the request and excludes names, contact details, internal identifiers, paths and file names when they are not needed.'),
    },
    {
      title: tr('Limitaciones', 'Limitazioni', 'Limitations'),
      body: tr('Los resultados generados por inteligencia artificial pueden contener errores y no constituyen un diagnóstico ni asesoramiento médico profesional.', 'I risultati generati dall’intelligenza artificiale possono contenere errori e non costituiscono una diagnosi né una consulenza medica professionale.', 'AI-generated results may contain errors and do not constitute a diagnosis or professional medical advice.'),
    },
  ];
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather color={colors.text} name="arrow-left" size={22} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{tr('Política de privacidad', 'Informativa sulla privacy', 'Privacy policy')}</Text>
          <View style={styles.back} />
        </View>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{section.body}</Text>
          </View>
        ))}
        <View style={[styles.placeholder, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>
            {tr('Información legal pendiente', 'Informazioni legali da completare', 'Legal information pending')}
          </Text>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            {tr(
              '• Nombre o razón social del desarrollador\n• Correo de contacto\n• Fecha de actualización\n• Proveedor concreto de Gemini\n• Enlace definitivo a la política de Google aplicable',
              '• Nome o ragione sociale dello sviluppatore\n• Email di contatto\n• Data di aggiornamento\n• Fornitore Gemini specifico\n• Link definitivo all’informativa Google applicabile',
              '• Developer name or company name\n• Contact email\n• Update date\n• Specific Gemini provider\n• Final link to the applicable Google policy'
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 44, paddingTop: Platform.OS === 'web' ? 24 : 54 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { fontSize: 18, fontWeight: '800' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 13, lineHeight: 21 },
  placeholder: { borderRadius: 14, marginTop: 28, padding: 15 },
  placeholderTitle: { fontSize: 14, fontWeight: '800' },
  placeholderText: { fontSize: 12, lineHeight: 20, marginTop: 7 },
});
