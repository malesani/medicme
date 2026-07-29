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
import { useLanguage } from '@/context/language-context';
import { safeLogger } from '@/utils/safe-logger';
import { addAttachment, addMeasurement, createExam } from '@/db';
import {
  deleteStoredDocument,
  storeDocument,
  type PendingDocument,
} from '@/services/document-storage';

type PendingMeasurement = {
  name: string;
  value: number;
  unit: string;
  rangeMin: number | null;
  rangeMax: number | null;
};

export default function NewExamScreen() {
  const colors = useColors();
  const { tr } = useLanguage();
  const categories = [
    { key: 'laboratorio', label: tr('Laboratorio', 'Laboratorio', 'Laboratory'), icon: 'droplet' as const },
    { key: 'cardiologia', label: tr('Cardiología', 'Cardiologia', 'Cardiology'), icon: 'heart' as const },
    { key: 'radiologia', label: tr('Radiología', 'Radiologia', 'Radiology'), icon: 'aperture' as const },
    { key: 'dental', label: tr('Dental', 'Dentale', 'Dental'), icon: 'smile' as const },
    { key: 'general', label: tr('General', 'Generale', 'General'), icon: 'clipboard' as const },
  ];
  const [name, setName] = useState('');
  const [category, setCategory] = useState('laboratorio');
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
        tr('Disponible en la app móvil', 'Disponibile nell’app mobile', 'Available in the mobile app'),
        tr('La carpeta privada de MedPocket se crea en Android e iOS.', 'La cartella privata di MedPocket viene creata su Android e iOS.', 'MedPocket’s private folder is created on Android and iOS.')
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
      Alert.alert(tr('Disponible en la app móvil', 'Disponibile nell’app mobile', 'Available in the mobile app'), tr('La galería se integra en Android e iOS.', 'La galleria è integrata su Android e iOS.', 'The gallery is integrated on Android and iOS.'));
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
      Alert.alert(tr('Disponible en la app móvil', 'Disponibile nell’app mobile', 'Available in the mobile app'), tr('La cámara se integra en Android e iOS.', 'La fotocamera è integrata su Android e iOS.', 'The camera is integrated on Android and iOS.'));
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(tr('Permiso necesario', 'Autorizzazione necessaria', 'Permission required'), tr('Autoriza el acceso a la cámara para fotografiar el documento.', 'Autorizza l’accesso alla fotocamera per fotografare il documento.', 'Allow camera access to photograph the document.'));
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
      Alert.alert(tr('Revisa el valor', 'Controlla il valore', 'Check the value'), tr('Indica un nombre y un resultado numérico.', 'Inserisci un nome e un risultato numerico.', 'Enter a name and a numeric result.'));
      return;
    }
    if (
      (min !== null && !Number.isFinite(min)) ||
      (max !== null && !Number.isFinite(max)) ||
      (min !== null && max !== null && min >= max)
    ) {
      Alert.alert(tr('Rango no válido', 'Intervallo non valido', 'Invalid range'), tr('El mínimo debe ser menor que el máximo.', 'Il minimo deve essere inferiore al massimo.', 'The minimum must be lower than the maximum.'));
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
      Alert.alert(tr('Falta el nombre', 'Nome mancante', 'Name required'), tr('Escribe el nombre del examen.', 'Inserisci il nome dell’esame.', 'Enter the exam name.'));
      return;
    }
    try {
      setSaving(true);
      const examDate = new Date().toISOString();
      const exam = await createExam({
        date: examDate,
        type: name.trim(),
        notes: notes.trim() || categories.find((item) => item.key === category)?.label || category,
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
    } catch {
      safeLogger.error('Exam saving failed', { code: 'EXAM_SAVE_FAILED' });
      Alert.alert(tr('Error', 'Errore', 'Error'), tr('No se pudo guardar el examen.', 'Impossibile salvare l’esame.', 'The exam could not be saved.'));
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
          <Text style={[styles.title, { color: colors.text }]}>{tr('Nuevo examen', 'Nuovo esame', 'New exam')}</Text>
          <View style={styles.headerAction} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>{tr('Añadir documentos', 'Aggiungi documenti', 'Add documents')}</Text>
        <View style={styles.mediaRow}>
          <MediaButton icon="camera" label={tr('Cámara', 'Fotocamera', 'Camera')} onPress={takePhoto} />
          <MediaButton icon="image" label={tr('Galería', 'Galleria', 'Gallery')} onPress={pickFromGallery} />
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
                      : tr('Archivo seleccionado', 'File selezionato', 'File selected')}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`${tr('Quitar', 'Rimuovi', 'Remove')} ${document.name}`}
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

        <Text style={[styles.label, { color: colors.text }]}>{tr('Valores del examen', 'Valori dell’esame', 'Exam values')}</Text>
        <View style={[styles.measurementForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            onChangeText={setMeasurementName}
            placeholder={tr('Nombre (ej. Glucosa)', 'Nome (es. Glucosio)', 'Name (e.g. Glucose)')}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={measurementName}
          />
          <View style={styles.measurementRow}>
            <TextInput
              inputMode="decimal"
              onChangeText={setMeasurementValue}
              placeholder={tr('Resultado', 'Risultato', 'Result')}
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
              placeholder={tr('Unidad', 'Unità', 'Unit')}
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
              placeholder={tr('Rango mín. (opcional)', 'Intervallo min. (opzionale)', 'Min. range (optional)')}
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
              placeholder={tr('Rango máx. (opcional)', 'Intervallo max. (opzionale)', 'Max. range (optional)')}
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
              {tr('Añadir valor al examen', 'Aggiungi valore all’esame', 'Add value to exam')}
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
                      ? ` · ${tr('Rango', 'Intervallo', 'Range')} ${measurement.rangeMin ?? '—'}–${measurement.rangeMax ?? '—'}`
                      : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`${tr('Quitar', 'Rimuovi', 'Remove')} ${measurement.name}`}
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

        <Text style={[styles.label, { color: colors.text }]}>{tr('Categoría', 'Categoria', 'Category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categories}>
            {categories.map((item) => {
              const active = category === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setCategory(item.key)}
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

        <Text style={[styles.label, { color: colors.text }]}>{tr('Información', 'Informazioni', 'Information')}</Text>
        <TextInput
          onChangeText={setName}
          placeholder={tr('Nombre del examen', 'Nome dell’esame', 'Exam name')}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={name}
        />
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder={tr('Centro médico, profesional y notas', 'Centro medico, professionista e note', 'Medical center, professional and notes')}
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
          <Text style={styles.saveText}>{saving ? tr('Guardando…', 'Salvataggio…', 'Saving…') : tr('Guardar examen', 'Salva esame', 'Save exam')}</Text>
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
