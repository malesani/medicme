import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { useLanguage } from '@/context/language-context';
import { safeLogger } from '@/utils/safe-logger';
import {
  getExamById,
  listAttachments,
  listMeasurementsByExam,
  type Attachment,
  type Exam,
  type Measurement,
} from '@/db';
import { openStoredDocument } from '@/services/document-storage';

export default function ExamDetailScreen() {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getExamById(id), listAttachments(id), listMeasurementsByExam(id)])
      .then(([loadedExam, loadedAttachments, loadedMeasurements]) => {
        setExam(loadedExam);
        setAttachments(loadedAttachments);
        setMeasurements(loadedMeasurements);
      })
      .catch(() => safeLogger.error('Exam loading failed', { code: 'EXAM_LOAD_FAILED' }));
  }, [id]);

  const openAttachment = async (attachment: Attachment) => {
    try {
      await openStoredDocument(attachment.path, attachment.mime_type);
    } catch {
      safeLogger.error('Attachment opening failed', { code: 'ATTACHMENT_OPEN_FAILED' });
      Alert.alert(tr('No se pudo abrir', 'Impossibile aprire', 'Could not open'), tr('No encontramos una aplicación compatible con este archivo.', 'Non è stata trovata un’applicazione compatibile con questo file.', 'No compatible application was found for this file.'));
    }
  };

  if (!exam) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.action}>
            <Feather color={colors.text} name="arrow-left" size={22} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.action}><Feather color={colors.text} name="share-2" size={20} /></Pressable>
            <Pressable style={styles.action}><Feather color={colors.text} name="edit-2" size={20} /></Pressable>
          </View>
        </View>
        <View style={[styles.heroIcon, { backgroundColor: colors.laboratorioLight }]}>
          <Feather color={colors.laboratorio} name="droplet" size={28} />
        </View>
        <Text style={[styles.category, { color: colors.laboratorio }]}>{tr('EXAMEN MÉDICO', 'ESAME MEDICO', 'MEDICAL EXAM')}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{exam.type}</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {new Date(exam.date).toLocaleDateString(locale, { dateStyle: 'long' })}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Info icon="map-pin" label={tr('Centro médico', 'Centro medico', 'Medical center')} value={tr('Registro personal', 'Registro personale', 'Personal record')} />
          <Info icon="user" label={tr('Especialidad', 'Specialità', 'Specialty')} value={tr('General', 'Generale', 'General')} />
          <Info icon="file-text" label={tr('Notas', 'Note', 'Notes')} value={exam.notes || tr('Sin notas', 'Nessuna nota', 'No notes')} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {tr('Valores', 'Valori', 'Values')} ({measurements.length})
        </Text>
        {measurements.length === 0 ? (
          <View style={[styles.emptyFiles, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather color={colors.mutedForeground} name="activity" size={24} />
            <Text style={[styles.emptyFilesText, { color: colors.mutedForeground }]}>
              {tr('Este examen no tiene valores asociados.', 'Questo esame non ha valori associati.', 'This exam has no associated values.')}
            </Text>
          </View>
        ) : (
          <View style={styles.files}>
            {measurements.map((measurement) => (
              <View
                key={measurement.id}
                style={[
                  styles.measurement,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <View style={[styles.fileIcon, { backgroundColor: colors.secondaryLight }]}>
                  <Feather color={colors.secondary} name="activity" size={21} />
                </View>
                <View style={styles.fileCopy}>
                  <Text style={[styles.fileName, { color: colors.text }]}>
                    {measurement.metric_code
                      .replaceAll('_', ' ')
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </Text>
                  <Text style={[styles.fileMeta, { color: colors.mutedForeground }]}>
                    {tr('Rango:', 'Intervallo:', 'Range:')} {measurement.range_min ?? '—'}–{measurement.range_max ?? '—'}
                  </Text>
                </View>
                <Text style={[styles.measurementValue, { color: colors.text }]}>
                  {measurement.value}{' '}
                  <Text style={[styles.measurementUnit, { color: colors.mutedForeground }]}>
                    {measurement.unit}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {tr('Documentos', 'Documenti', 'Documents')} ({attachments.length})
        </Text>
        {attachments.length === 0 ? (
          <View style={[styles.emptyFiles, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather color={colors.mutedForeground} name="folder" size={24} />
            <Text style={[styles.emptyFilesText, { color: colors.mutedForeground }]}>
              {tr('Este examen no tiene archivos adjuntos.', 'Questo esame non ha file allegati.', 'This exam has no attached files.')}
            </Text>
          </View>
        ) : (
          <View style={styles.files}>
            {attachments.map((attachment) => {
              const isImage = attachment.mime_type.startsWith('image/');
              return (
                <Pressable
                  key={attachment.id}
                  onPress={() => openAttachment(attachment)}
                  style={[
                    styles.file,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}>
                  {isImage ? (
                    <Image source={{ uri: attachment.path }} style={styles.thumbnail} />
                  ) : (
                    <View style={[styles.fileIcon, { backgroundColor: colors.primaryLight }]}>
                      <Feather color={colors.primary} name="file-text" size={22} />
                    </View>
                  )}
                  <View style={styles.fileCopy}>
                    <Text numberOfLines={1} style={[styles.fileName, { color: colors.text }]}>
                      {attachment.original_name || tr('Documento médico', 'Documento medico', 'Medical document')}
                    </Text>
                    <Text style={[styles.fileMeta, { color: colors.mutedForeground }]}>
                      {attachment.size
                        ? `${Math.ceil(attachment.size / 1024)} KB`
                        : attachment.mime_type}
                    </Text>
                  </View>
                  <Feather color={colors.mutedForeground} name="external-link" size={17} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );

  function Info({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
    return (
      <View style={styles.info}>
        <Feather color={colors.primary} name={icon} size={18} />
        <View style={styles.infoCopy}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'web' ? 24 : 54,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  headerActions: { flexDirection: 'row', gap: 8 },
  action: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  heroIcon: { alignItems: 'center', borderRadius: 16, height: 58, justifyContent: 'center', marginBottom: 15, width: 58 },
  category: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 5 },
  date: { fontSize: 14, marginTop: 7 },
  card: { borderRadius: 16, borderWidth: 1, gap: 18, marginTop: 26, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 11, marginTop: 26 },
  emptyFiles: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 9,
    padding: 24,
  },
  emptyFilesText: { fontSize: 13, textAlign: 'center' },
  files: { gap: 9 },
  file: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 11,
  },
  fileIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  thumbnail: { borderRadius: 10, height: 46, width: 46 },
  fileCopy: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '700' },
  fileMeta: { fontSize: 11, marginTop: 3 },
  measurement: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 11,
  },
  measurementValue: { fontSize: 18, fontWeight: '800' },
  measurementUnit: { fontSize: 11, fontWeight: '500' },
  info: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  infoCopy: { flex: 1, gap: 3 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 15, fontWeight: '600' },
});
