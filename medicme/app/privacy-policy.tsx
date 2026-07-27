import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

const sections = [
  {
    title: 'Almacenamiento local',
    body: 'Los datos médicos, documentos, citas y valores introducidos en MedPocket se almacenan exclusivamente en el dispositivo. La aplicación no dispone de una base de datos propia para recopilar esta información y el desarrollador no puede acceder a ella.',
  },
  {
    title: 'Uso de inteligencia artificial',
    body: 'Cuando activas voluntariamente una función de inteligencia artificial, los datos seleccionados pueden enviarse temporalmente a Google Gemini para realizar la operación solicitada. Antes de cada solicitud se muestra la información que será enviada. Esta función es opcional y puede desactivarse desde Privacidad.',
  },
  {
    title: 'Minimización de datos',
    body: 'MedPocket envía solamente la información necesaria para completar la solicitud y excluye nombres, datos de contacto, identificadores internos, rutas y nombres de archivos cuando no son necesarios.',
  },
  {
    title: 'Limitaciones',
    body: 'Los resultados generados por inteligencia artificial pueden contener errores y no constituyen un diagnóstico ni asesoramiento médico profesional.',
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Feather color={colors.text} name="arrow-left" size={22} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Política de privacidad</Text>
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
            Información legal pendiente
          </Text>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            • Nombre o razón social del desarrollador{'\n'}
            • Correo de contacto{'\n'}
            • Fecha de actualización{'\n'}
            • Proveedor concreto de Gemini{'\n'}
            • Enlace definitivo a la política de Google aplicable
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
