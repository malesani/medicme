import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniChart } from '@/components/mini-chart';
import { useProfile } from '@/context/profile-context';
import { useLanguage } from '@/context/language-context';
import { useColors } from '@/hooks/use-colors';
import { safeLogger } from '@/utils/safe-logger';
import { getNextEvent, type NextEvent } from '@/db/home';
import {
  listExams,
  listMeasurements,
  normalizeMetricCode,
  type Exam,
  type Measurement,
} from '@/db';

type MetricPreview = {
  latest: Measurement;
  previous?: Measurement;
  history: number[];
};

export default function HomeScreen() {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [nextAppointment, setNextAppointment] = useState<NextEvent | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const load = useCallback(async () => {
    try {
      const [appointment, allExams, allValues] = await Promise.all([
        getNextEvent(new Date().toISOString()),
        listExams(),
        listMeasurements(),
      ]);
      setNextAppointment(appointment);
      setExams(allExams.slice(0, 3));
      setMeasurements(allValues);
    } catch {
      safeLogger.error('Home loading failed', { code: 'HOME_LOAD_FAILED' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const recentValues = useMemo(() => {
    const grouped = new Map<string, Measurement[]>();
    measurements.forEach((measurement) => {
      const normalizedCode = normalizeMetricCode(measurement.metric_code);
      grouped.set(normalizedCode, [
        ...(grouped.get(normalizedCode) ?? []),
        measurement,
      ]);
    });
    return Array.from(grouped.values())
      .slice(0, 4)
      .map<MetricPreview>((rows) => ({
        latest: rows[0],
        previous: rows[1],
        history: [...rows].reverse().map((row) => row.value),
      }));
  }, [measurements]);

  const topPadding = Platform.OS === 'web' ? 20 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPadding + (Platform.OS === 'web' ? 4 : 10),
            paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100,
          },
        ]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{tr('Buenos días', 'Buongiorno', 'Good morning')}</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.first_name ?? tr('Hola', 'Ciao', 'Hello')}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/perfil')}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {profile?.first_name.charAt(0).toUpperCase() ?? 'M'}
              </Text>
            </View>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : (
          <>
            {nextAppointment ? (
              <View style={styles.section}>
                <View style={[styles.nextExamCard, { backgroundColor: colors.primary }]}>
                  <View style={styles.nextExamTop}>
                    <Text style={styles.nextExamLabel}>{tr('Próxima cita', 'Prossimo appuntamento', 'Next appointment')}</Text>
                    <View style={styles.nextExamBadge}>
                      <Feather color="#FFFFFF" name="calendar" size={12} />
                      <Text style={styles.nextExamTime}>
                        {new Date(nextAppointment.scheduled_at).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.nextExamName}>{nextAppointment.type}</Text>
                  <View style={styles.nextExamMeta}>
                    <Feather color="#DBEAFE" name="map-pin" size={13} />
                    <Text style={styles.nextExamMetaText}>{tr('Registro personal', 'Registro personale', 'Personal record')}</Text>
                  </View>
                  <View style={styles.nextExamMeta}>
                    <Feather color="#DBEAFE" name="user" size={13} />
                    <Text style={styles.nextExamMetaText}>{tr('Sin médico asignado', 'Nessun medico assegnato', 'No doctor assigned')}</Text>
                  </View>
                  <View style={styles.nextExamFooter}>
                    <Text style={styles.nextExamDateFull}>
                      {new Date(nextAppointment.scheduled_at).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Pressable onPress={() => router.push('/calendar')} style={styles.nextExamBtn}>
                      <Text style={styles.nextExamBtnText}>{tr('Ver detalles', 'Vedi dettagli', 'View details')}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/calendar')}
                style={[
                  styles.noCitaCard,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}>
                <Feather color={colors.primary} name="calendar" size={20} />
                <Text style={[styles.noCitaText, { color: colors.primary }]}>
                  {tr('Añadir próxima cita', 'Aggiungi il prossimo appuntamento', 'Add next appointment')}
                </Text>
              </Pressable>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {tr('Acciones rápidas', 'Azioni rapide', 'Quick actions')}
              </Text>
              <View style={styles.quickActions}>
                <QuickAction
                  background={colors.primaryLight}
                  color={colors.primary}
                  icon="camera"
                  label={tr('Foto', 'Foto', 'Photo')}
                  onPress={() => router.push('/examen/nuevo')}
                />
                <QuickAction
                  background={colors.radiologiaLight}
                  color={colors.radiologia}
                  icon="file-text"
                  label="PDF"
                  onPress={() => router.push('/examen/nuevo')}
                />
                <QuickAction
                  background={colors.secondaryLight}
                  color={colors.secondary}
                  icon="activity"
                  label={tr('Valor', 'Valore', 'Value')}
                  onPress={() => router.push('/values')}
                />
                <QuickAction
                  background={colors.oftalmologiaLight}
                  color={colors.oftalmologia}
                  icon="calendar"
                  label={tr('Cita', 'Appuntamento', 'Appointment')}
                  onPress={() => router.push('/calendar')}
                />
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title={tr('Últimos valores', 'Ultimi valori', 'Latest values')} onPress={() => router.push('/values')} />
              {recentValues.length > 0 ? (
                <View style={styles.valuesGrid}>
                  {recentValues.map((preview) => (
                    <ValuePreview key={preview.latest.metric_code} preview={preview} />
                  ))}
                </View>
              ) : (
                <EmptyPreview
                  action={tr('Registrar valor', 'Registra valore', 'Add value')}
                  description={tr('Tus últimos resultados aparecerán aquí.', 'I tuoi ultimi risultati appariranno qui.', 'Your latest results will appear here.')}
                  icon="activity"
                  onPress={() => router.push('/values')}
                />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title={tr('Documentos recientes', 'Documenti recenti', 'Recent documents')} onPress={() => router.push('/exams')} />
              {exams.length > 0 ? (
                <View>
                  {exams.map((exam) => (
                    <ExamPreview exam={exam} key={exam.id} />
                  ))}
                </View>
              ) : (
                <EmptyPreview
                  action={tr('Añadir examen', 'Aggiungi esame', 'Add exam')}
                  description={tr('Tus exámenes y documentos aparecerán aquí.', 'I tuoi esami e documenti appariranno qui.', 'Your exams and documents will appear here.')}
                  icon="file-text"
                  onPress={() => router.push('/examen/nuevo')}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Pressable
        accessibilityLabel={tr('Añadir examen', 'Aggiungi esame', 'Add exam')}
        onPress={() => router.push('/examen/nuevo')}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 82 }]}>
        <Feather color="#FFFFFF" name="plus" size={27} />
      </Pressable>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  background,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  background: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: background }]}>
        <Feather color={color} name={icon} size={22} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress: () => void }) {
  const colors = useColors();
  const { tr } = useLanguage();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Pressable onPress={onPress}>
        <Text style={[styles.seeAll, { color: colors.primary }]}>{tr('Ver todo', 'Vedi tutto', 'See all')}</Text>
      </Pressable>
    </View>
  );
}

function EmptyPreview({
  icon,
  description,
  action,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  description: string;
  action: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.emptyPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyPreviewIcon, { backgroundColor: colors.muted }]}>
        <Feather color={colors.mutedForeground} name={icon} size={22} />
      </View>
      <Text style={[styles.emptyPreviewText, { color: colors.mutedForeground }]}>
        {description}
      </Text>
      <Pressable onPress={onPress}>
        <Text style={[styles.emptyPreviewAction, { color: colors.primary }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

function ValuePreview({ preview }: { preview: MetricPreview }) {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const trend =
    !preview.previous || preview.latest.value === preview.previous.value
      ? 'minus'
      : preview.latest.value > preview.previous.value
        ? 'trending-up'
        : 'trending-down';
  const hasRange =
    preview.latest.range_min !== null || preview.latest.range_max !== null;
  const outsideRange =
    (preview.latest.range_min !== null &&
      preview.latest.value < preview.latest.range_min) ||
    (preview.latest.range_max !== null &&
      preview.latest.value > preview.latest.range_max);
  const statusColor = outsideRange
    ? colors.destructive
    : hasRange
      ? colors.secondary
      : colors.mutedForeground;
  const statusBackground = outsideRange
    ? colors.destructiveLight
    : hasRange
      ? colors.secondaryLight
      : colors.muted;
  return (
    <Pressable
      onPress={() =>
        preview.latest.exam_id
          ? router.push({
              pathname: '/examen/[id]',
              params: { id: preview.latest.exam_id },
            })
          : router.push('/values')
      }
      style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.valueHeader}>
        <Text numberOfLines={1} style={[styles.valueLabel, { color: colors.mutedForeground }]}>
          {preview.latest.metric_code
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase())}
        </Text>
        <Feather color={colors.secondary} name={trend} size={16} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.valueNumber, { color: colors.text }]}>{preview.latest.value}</Text>
        <Text style={[styles.valueUnit, { color: colors.mutedForeground }]}>
          {preview.latest.unit}
        </Text>
      </View>
      <View style={styles.valueBottom}>
        <MiniChart color={colors.secondary} values={preview.history} />
        {preview.previous ? (
          <Text style={[styles.valuePrevious, { color: colors.mutedForeground }]}>
              {tr('Prec:', 'Prec:', 'Prev:')} {preview.previous.value} {preview.previous.unit}
          </Text>
        ) : null}
      </View>
      <View style={styles.valueFooter}>
        <View style={[styles.valueStatus, { backgroundColor: statusBackground }]}>
          <View style={[styles.valueStatusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.valueStatusText, { color: statusColor }]}>
              {outsideRange ? tr('Fuera de rango', 'Fuori intervallo', 'Out of range') : hasRange ? tr('En rango', 'Nell’intervallo', 'In range') : tr('Sin rango', 'Senza intervallo', 'No range')}
          </Text>
        </View>
        <Text style={[styles.valueDate, { color: colors.mutedForeground }]}>
            {new Date(preview.latest.captured_at).toLocaleDateString(locale)}
        </Text>
      </View>
      {preview.latest.exam_id ? (
        <View style={[styles.valueExamLink, { borderTopColor: colors.border }]}>
          <Feather color={colors.primary} name="file-text" size={13} />
          <Text style={[styles.valueExamLinkText, { color: colors.primary }]}>
              {tr('Ver examen y documentos', 'Vedi esame e documenti', 'View exam and documents')}
          </Text>
          <Feather color={colors.primary} name="chevron-right" size={14} />
        </View>
      ) : null}
    </Pressable>
  );
}

function ExamPreview({ exam }: { exam: Exam }) {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/examen/[id]', params: { id: exam.id } })}
      style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.examIcon, { backgroundColor: colors.laboratorioLight }]}>
        <Feather color={colors.laboratorio} name="droplet" size={18} />
      </View>
      <View style={styles.examInfo}>
        <Text numberOfLines={1} style={[styles.examTitle, { color: colors.text }]}>
          {exam.type}
        </Text>
        <Text style={[styles.examMeta, { color: colors.mutedForeground }]}>
            {new Date(exam.date).toLocaleDateString(locale)} · {tr('Registro personal', 'Registro personale', 'Personal record')}
        </Text>
      </View>
      <Feather color={colors.mutedForeground} name="chevron-right" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: { fontSize: 14 },
  userName: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  avatar: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  loader: { marginTop: 70 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  nextExamCard: { borderRadius: 20, padding: 20 },
  nextExamTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nextExamLabel: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nextExamBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nextExamTime: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  nextExamName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  nextExamMeta: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  nextExamMetaText: { color: '#DBEAFE', fontSize: 13 },
  nextExamFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  nextExamDateFull: { color: '#DBEAFE', fontSize: 13, fontWeight: '600' },
  nextExamBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextExamBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  noCitaCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 28,
    padding: 20,
  },
  noCitaText: { fontSize: 15, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1, gap: 7 },
  quickIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  quickLabel: { fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  seeAll: { fontSize: 14, fontWeight: '700' },
  valuesGrid: { gap: 10 },
  emptyPreview: {
    alignItems: 'center',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  emptyPreviewIcon: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyPreviewText: { fontSize: 13, textAlign: 'center' },
  emptyPreviewAction: { fontSize: 13, fontWeight: '700' },
  valueCard: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 160,
    padding: 14,
    width: '100%',
  },
  valueHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  valueLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  valueRow: { alignItems: 'baseline', flexDirection: 'row', gap: 4, marginVertical: 7 },
  valueNumber: { fontSize: 30, fontWeight: '800', lineHeight: 34 },
  valueUnit: { fontSize: 13, fontWeight: '500' },
  valueBottom: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  valuePrevious: { fontSize: 11 },
  valueFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  valueStatus: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  valueStatusDot: { borderRadius: 3, height: 6, width: 6 },
  valueStatusText: { fontSize: 11, fontWeight: '700' },
  valueDate: { fontSize: 11 },
  valueExamLink: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginTop: 11,
    paddingTop: 9,
  },
  valueExamLinkText: { flex: 1, fontSize: 11, fontWeight: '700' },
  examCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    marginBottom: 10,
    padding: 14,
  },
  examIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  examInfo: { flex: 1, gap: 3 },
  examTitle: { fontSize: 15, fontWeight: '700' },
  examMeta: { fontSize: 12 },
  fab: {
    alignItems: 'center',
    borderRadius: 28,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    width: 56,
  },
});
