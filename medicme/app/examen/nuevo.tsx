import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { createExam } from '@/db';

const categories = [
  { label: 'Laboratorio', icon: 'droplet' as const },
  { label: 'Cardiología', icon: 'heart' as const },
  { label: 'Radiología', icon: 'aperture' as const },
  { label: 'Dental', icon: 'smile' as const },
  { label: 'General', icon: 'clipboard' as const },
];

export default function NewExamScreen() {
  const colors = useColors();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laboratorio');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del examen.');
      return;
    }
    try {
      setSaving(true);
      await createExam({
        date: new Date().toISOString(),
        type: name.trim(),
        notes: notes.trim() || category,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el examen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <Feather color={colors.text} name="x" size={23} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Nuevo examen</Text>
          <View style={styles.headerAction} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Añadir documentos</Text>
        <View style={styles.mediaRow}>
          <MediaButton icon="camera" label="Cámara" />
          <MediaButton icon="image" label="Galería" />
          <MediaButton icon="file-text" label="PDF" />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categories}>
            {categories.map((item) => {
              const active = category === item.label;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setCategory(item.label)}
                  style={[
                    styles.category,
                    {
                      backgroundColor: active ? colors.primaryLight : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}>
                  <Feather
                    color={active ? colors.primary : colors.mutedForeground}
                    name={item.icon}
                    size={19}
                  />
                  <Text style={{ color: active ? colors.primary : colors.mutedForeground, fontWeight: '600' }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text style={[styles.label, { color: colors.text }]}>Información</Text>
        <TextInput
          onChangeText={setName}
          placeholder="Nombre del examen"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={name}
        />
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Centro médico, profesional y notas"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            styles.notes,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          value={notes}
        />
        <Pressable
          disabled={saving}
          onPress={save}
          style={[styles.save, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar examen'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  function MediaButton({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
    return (
      <Pressable style={[styles.mediaButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.mediaIcon, { backgroundColor: colors.primaryLight }]}>
          <Feather color={colors.primary} name={icon} size={21} />
        </View>
        <Text style={[styles.mediaLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 54,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  headerAction: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { fontSize: 19, fontWeight: '800' },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 11, marginTop: 20 },
  mediaRow: { flexDirection: 'row', gap: 10 },
  mediaButton: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flex: 1, gap: 8, padding: 13 },
  mediaIcon: { alignItems: 'center', borderRadius: 11, height: 42, justifyContent: 'center', width: 42 },
  mediaLabel: { fontSize: 12, fontWeight: '600' },
  categories: { flexDirection: 'row', gap: 8 },
  category: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 7, padding: 11 },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, marginBottom: 11, padding: 14 },
  notes: { minHeight: 110, textAlignVertical: 'top' },
  save: { alignItems: 'center', borderRadius: 12, marginTop: 12, padding: 15 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
