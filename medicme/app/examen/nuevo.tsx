import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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
import { addAttachment, addMeasurement, createExam } from '@/db';
import {
  deleteStoredDocument,
  storeDocument,
  type PendingDocument,
} from '@/services/document-storage';

const categories = [
  { label: 'Laboratorio', icon: 'droplet' as const },
  { label: 'Cardiología', icon: 'heart' as const },
  { label: 'Radiología', icon: 'aperture' as const },
  { label: 'Dental', icon: 'smile' as const },
  { label: 'General', icon: 'clipboard' as const },
];

type PendingMeasurement = {
  name: string;
  value: number;
  unit: string;
  rangeMin: number | null;
  rangeMax: number | null;
};

export default function NewExamScreen() {
  const colors = useColors();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laboratorio');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [measurements, setMeasurements] = useState<PendingMeasurement[]>([]);
  const [measurementName, setMeasurementName] = useState('');
  const [measurementValue, setMeasurementValue] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('');
  const [measurementMin, setMeasurementMin] = useState('');
  const [measurementMax, setMeasurementMax] = useState('');
  const [saving, setSaving] = useState(false);

  const addDocuments = (items: PendingDocument[]) => {
    setDocuments((current) => [...current, ...items]);
  };

  const pickDocuments = async (type: string | string[]) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Disponible en la app móvil',
        'La carpeta privada de MedPocket se crea en Android e iOS.'
      );
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type,
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled) return;

    addDocuments(
      result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      }))
    );
  };

  const pickFromGallery = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Disponible en la app móvil', 'La galería se integra en Android e iOS.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;

    addDocuments(
      result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `imagen-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      }))
    );
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Disponible en la app móvil', 'La cámara se integra en Android e iOS.');
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Autoriza el acceso a la cámara para fotografiar el documento.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    addDocuments([{
      uri: asset.uri,
      name: asset.fileName ?? `foto-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
    }]);
  };

  const addPendingMeasurement = () => {
    const numericValue = Number(measurementValue.replace(',', '.'));
    const min = measurementMin.trim()
      ? Number(measurementMin.replace(',', '.'))
      : null;
    const max = measurementMax.trim()
      ? Number(measurementMax.replace(',', '.'))
      : null;

    if (!measurementName.trim() || !Number.isFinite(numericValue)) {
      Alert.alert('Revisa el valor', 'Indica un nombre y un resultado numérico.');
      return;
    }
    if (
      (min !== null && !Number.isFinite(min)) ||
      (max !== null && !Number.isFinite(max)) ||
      (min !== null && max !== null && min >= max)
    ) {
      Alert.alert('Rango no válido', 'El mínimo debe ser menor que el máximo.');
      return;
    }

    setMeasurements((current) => [
      ...current,
      {
        name: measurementName.trim(),
        value: numericValue,
        unit: measurementUnit.trim(),
        rangeMin: min,
        rangeMax: max,
      },
    ]);
    setMeasurementName('');
    setMeasurementValue('');
    setMeasurementUnit('');
    setMeasurementMin('');
    setMeasurementMax('');
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del examen.');
      return;
    }
    try {
      setSaving(true);
      const examDate = new Date().toISOString();
      const exam = await createExam({
        date: examDate,
        type: name.trim(),
        notes: notes.trim() || category,
      });
      for (const document of documents) {
        const stored = storeDocument(document);
        try {
          await addAttachment({
            examId: exam.id,
            path: stored.uri,
            originalName: stored.name,
            mimeType: stored.mimeType,
            size: stored.size,
          });
        } catch (error) {
          deleteStoredDocument(stored.uri);
          throw error;
        }
      }
      for (const measurement of measurements) {
        await addMeasurement({
          examId: exam.id,
          metricCode: measurement.name,
          value: measurement.value,
          unit: measurement.unit,
          capturedAt: examDate,
          rangeMin: measurement.rangeMin,
          rangeMax: measurement.rangeMax,
        });
      }
      router.back();
    } catch (error) {
      console.error('Error saving exam:', error);
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
          <MediaButton icon="camera" label="Cámara" onPress={takePhoto} />
          <MediaButton icon="image" label="Galería" onPress={pickFromGallery} />
          <MediaButton
            icon="file-text"
            label="PDF"
            onPress={() => pickDocuments('application/pdf')}
          />
        </View>
        {documents.length > 0 ? (
          <View style={styles.selectedFiles}>
            {documents.map((document, index) => (
              <View
                key={`${document.uri}-${index}`}
                style={[
                  styles.selectedFile,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Feather
                  color={colors.primary}
                  name={document.mimeType.startsWith('image/') ? 'image' : 'file-text'}
                  size={18}
                />
                <View style={styles.selectedFileCopy}>
                  <Text numberOfLines={1} style={[styles.selectedFileName, { color: colors.text }]}>
                    {document.name}
                  </Text>
                  <Text style={[styles.selectedFileMeta, { color: colors.mutedForeground }]}>
                    {document.size
                      ? `${Math.ceil(document.size / 1024)} KB`
                      : 'Archivo seleccionado'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Quitar ${document.name}`}
                  onPress={() =>
                    setDocuments((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  style={styles.removeFile}>
                  <Feather color={colors.mutedForeground} name="x" size={18} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={[styles.label, { color: colors.text }]}>Valores del examen</Text>
        <View style={[styles.measurementForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            onChangeText={setMeasurementName}
            placeholder="Nombre (ej. Glucosa)"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={measurementName}
          />
          <View style={styles.measurementRow}>
            <TextInput
              inputMode="decimal"
              onChangeText={setMeasurementValue}
              placeholder="Resultado"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.measurementValue,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={measurementValue}
            />
            <TextInput
              onChangeText={setMeasurementUnit}
              placeholder="Unidad"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.measurementUnit,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={measurementUnit}
            />
          </View>
          <View style={styles.measurementRow}>
            <TextInput
              inputMode="decimal"
              onChangeText={setMeasurementMin}
              placeholder="Rango mín. (opcional)"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.measurementValue,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={measurementMin}
            />
            <TextInput
              inputMode="decimal"
              onChangeText={setMeasurementMax}
              placeholder="Rango máx. (opcional)"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.measurementValue,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={measurementMax}
            />
          </View>
          <Pressable
            onPress={addPendingMeasurement}
            style={[styles.addMeasurement, { backgroundColor: colors.primaryLight }]}>
            <Feather color={colors.primary} name="plus" size={17} />
            <Text style={[styles.addMeasurementText, { color: colors.primary }]}>
              Añadir valor al examen
            </Text>
          </Pressable>
        </View>
        {measurements.length > 0 ? (
          <View style={styles.measurementList}>
            {measurements.map((measurement, index) => (
              <View
                key={`${measurement.name}-${index}`}
                style={[
                  styles.measurementItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View style={[styles.measurementIcon, { backgroundColor: colors.secondaryLight }]}>
                  <Feather color={colors.secondary} name="activity" size={17} />
                </View>
                <View style={styles.selectedFileCopy}>
                  <Text style={[styles.selectedFileName, { color: colors.text }]}>
                    {measurement.name}
                  </Text>
                  <Text style={[styles.selectedFileMeta, { color: colors.mutedForeground }]}>
                    {measurement.value} {measurement.unit}
                    {measurement.rangeMin !== null || measurement.rangeMax !== null
                      ? ` · Rango ${measurement.rangeMin ?? '—'}–${measurement.rangeMax ?? '—'}`
                      : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`Quitar ${measurement.name}`}
                  onPress={() =>
                    setMeasurements((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  style={styles.removeFile}>
                  <Feather color={colors.mutedForeground} name="x" size={18} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

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

  function MediaButton({
    icon,
    label,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.mediaButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
  selectedFiles: { gap: 8, marginTop: 12 },
  selectedFile: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 11,
  },
  selectedFileCopy: { flex: 1 },
  selectedFileName: { fontSize: 13, fontWeight: '700' },
  selectedFileMeta: { fontSize: 11, marginTop: 2 },
  removeFile: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  measurementForm: { borderRadius: 14, borderWidth: 1, padding: 12 },
  measurementRow: { flexDirection: 'row', gap: 9 },
  measurementValue: { flex: 1, minWidth: 0 },
  measurementUnit: { flex: 0.7, minWidth: 0 },
  addMeasurement: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    padding: 12,
  },
  addMeasurementText: { fontSize: 13, fontWeight: '700' },
  measurementList: { gap: 8, marginTop: 10 },
  measurementItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 11,
  },
  measurementIcon: {
    alignItems: 'center',
    borderRadius: 9,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  categories: { flexDirection: 'row', gap: 8 },
  category: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 7, padding: 11 },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, marginBottom: 11, padding: 14 },
  notes: { minHeight: 110, textAlignVertical: 'top' },
  save: { alignItems: 'center', borderRadius: 12, marginTop: 12, padding: 15 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
