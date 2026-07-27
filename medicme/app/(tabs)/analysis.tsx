import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listLatestMeasurements, type Measurement } from '@/db';
import { useColors } from '@/hooks/use-colors';
import {
  analyzeHealthMeasurements,
  type AgentFinding,
  type HealthAgentAnalysis,
} from '@/services/health-agent';

type MeasurementStatus = 'high' | 'low' | 'normal' | 'unknown';

function getStatus(measurement: Measurement): MeasurementStatus {
  if (measurement.range_max !== null && measurement.value > measurement.range_max) return 'high';
  if (measurement.range_min !== null && measurement.value < measurement.range_min) return 'low';
  if (measurement.range_min !== null || measurement.range_max !== null) return 'normal';
  return 'unknown';
}

function metricName(code: string) {
  return code
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AnalysisScreen() {
  const colors = useColors();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<HealthAgentAnalysis | null>(null);

  const load = useCallback(async () => {
    try {
      setMeasurements(await listLatestMeasurements());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const overview = useMemo(() => {
    const statuses = measurements.map(getStatus);
    return {
      outside: statuses.filter((status) => status === 'high' || status === 'low').length,
      normal: statuses.filter((status) => status === 'normal').length,
      unknown: statuses.filter((status) => status === 'unknown').length,
    };
  }, [measurements]);

  const analyze = async () => {
    try {
      setAnalyzing(true);
      setAnalysis(null);
      setAnalysis(await analyzeHealthMeasurements(measurements));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo consultar Gemini.';
      Alert.alert('No se pudo realizar el análisis', message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.assistantIcon, { backgroundColor: colors.primary }]}>
            <Feather color="#FFFFFF" name="heart" size={25} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ASISTENTE DE SALUD</Text>
            <Text style={[styles.title, { color: colors.text }]}>Mi análisis</Text>
          </View>
        </View>

        <View
          style={[
            styles.hero,
            { backgroundColor: colors.primaryLight, borderColor: colors.primary },
          ]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Entiende mejor tus últimos resultados
          </Text>
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            Revisamos tus valores más recientes y sus rangos para explicarte qué significan de
            manera sencilla.
          </Text>
          <View style={styles.heroMeta}>
            <Feather color={colors.primary} name="shield" size={15} />
            <Text style={[styles.heroMetaText, { color: colors.primary }]}>
              Información orientativa, no un diagnóstico
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : measurements.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather color={colors.mutedForeground} name="activity" size={28} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Necesito algunos valores
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Registra al menos un resultado con su unidad y rango para preparar tu análisis.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/values')}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Feather color="#FFFFFF" name="plus" size={18} />
              <Text style={styles.primaryButtonText}>Añadir un valor</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen reciente</Text>
            <View style={styles.summaryRow}>
              <SummaryCard
                color={colors.destructive}
                label="A revisar"
                value={overview.outside}
              />
              <SummaryCard color={colors.secondary} label="En rango" value={overview.normal} />
              <SummaryCard
                color={colors.mutedForeground}
                label="Sin rango"
                value={overview.unknown}
              />
            </View>

            <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.analysisHeading}>
                <View style={[styles.sparkle, { backgroundColor: colors.primaryLight }]}>
                  <Feather color={colors.primary} name="zap" size={18} />
                </View>
                <View style={styles.analysisHeadingCopy}>
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>
                    Listo para analizar
                  </Text>
                  <Text style={[styles.analysisSubtitle, { color: colors.mutedForeground }]}>
                    {measurements.length} valores recientes seleccionados
                  </Text>
                </View>
              </View>

              <View style={styles.measurementList}>
                {measurements.slice(0, 4).map((measurement) => (
                  <MeasurementRow key={measurement.id} measurement={measurement} />
                ))}
              </View>

              <Pressable
                disabled={analyzing}
                onPress={analyze}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  analyzing && styles.disabledButton,
                ]}>
                {analyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Feather color="#FFFFFF" name="message-circle" size={18} />
                )}
                <Text style={styles.primaryButtonText}>
                  {analyzing ? 'Analizando…' : 'Analizar mis valores'}
                </Text>
              </Pressable>
            </View>

            {analysis ? (
              <View style={styles.results}>
                <View style={styles.resultsHeading}>
                  <View style={[styles.sparkle, { backgroundColor: colors.secondaryLight }]}>
                    <Feather color={colors.secondary} name="check-circle" size={19} />
                  </View>
                  <View style={styles.analysisHeadingCopy}>
                    <Text style={[styles.analysisTitle, { color: colors.text }]}>
                      Tu análisis está listo
                    </Text>
                    <Text style={[styles.analysisSubtitle, { color: colors.mutedForeground }]}>
                      Explicación de tus resultados más recientes
                    </Text>
                  </View>
                </View>

                <View style={[styles.summaryTextCard, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.summaryText, { color: colors.text }]}>{analysis.summary}</Text>
                </View>

                {analysis.findings.map((finding, index) => (
                  <ResultCard finding={finding} key={`${finding.metricCode}-${index}`} />
                ))}

                <View style={[styles.safetyNote, { backgroundColor: colors.warningLight }]}>
                  <Feather color={colors.warning} name="alert-circle" size={17} />
                  <Text style={[styles.safetyText, { color: colors.text }]}>
                    {analysis.disclaimer}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );

  function SummaryCard({
    color,
    label,
    value,
  }: {
    color: string;
    label: string;
    value: number;
  }) {
    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    );
  }

  function MeasurementRow({ measurement }: { measurement: Measurement }) {
    const status = getStatus(measurement);
    const statusColor =
      status === 'high' || status === 'low'
        ? colors.destructive
        : status === 'normal'
          ? colors.secondary
          : colors.mutedForeground;
    const statusText =
      status === 'high'
        ? 'Alto'
        : status === 'low'
          ? 'Bajo'
          : status === 'normal'
            ? 'En rango'
            : 'Sin rango';

    return (
      <View style={[styles.measurementRow, { borderBottomColor: colors.border }]}>
        <View style={styles.measurementCopy}>
          <Text style={[styles.measurementName, { color: colors.text }]}>
            {metricName(measurement.metric_code)}
          </Text>
          <Text style={[styles.measurementDate, { color: colors.mutedForeground }]}>
            {new Date(measurement.captured_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.measurementResult}>
          <Text style={[styles.measurementValue, { color: colors.text }]}>
            {measurement.value} {measurement.unit}
          </Text>
          <Text style={[styles.measurementStatus, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>
    );
  }

  function ResultCard({ finding }: { finding: AgentFinding }) {
    const measurement = measurements.find(
      (item) => item.metric_code === finding.metricCode
    );
    const status = finding.status;
    const statusColor =
      status === 'high' || status === 'low'
        ? colors.destructive
        : status === 'normal'
          ? colors.secondary
          : colors.mutedForeground;
    return (
      <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.resultTitleRow}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {metricName(finding.metricCode)}
          </Text>
          <Text style={[styles.resultNumber, { color: statusColor }]}>
            {measurement ? `${measurement.value} ${measurement.unit}` : status}
          </Text>
        </View>
        <Text style={[styles.resultMeaning, { color: colors.mutedForeground }]}>
          {finding.meaning}
        </Text>
        <View style={[styles.interpretation, { backgroundColor: colors.muted }]}>
          <Text style={[styles.interpretationText, { color: colors.text }]}>
            {finding.explanation}
          </Text>
        </View>
        <Text style={[styles.suggestionTitle, { color: colors.text }]}>Para cuidarte</Text>
        {finding.suggestions.map((suggestion) => (
          <View key={suggestion} style={styles.suggestionRow}>
            <Feather color={colors.secondary} name="check" size={15} />
            <Text style={[styles.suggestionText, { color: colors.mutedForeground }]}>
              {suggestion}
            </Text>
          </View>
        ))}
        <Text style={[styles.professionalAdvice, { color: colors.primary }]}>
          {finding.professionalAdvice}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 58,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 13, marginBottom: 22 },
  assistantIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 30, fontWeight: '800', marginTop: 1 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 20 },
  heroTitle: { fontSize: 21, fontWeight: '800', lineHeight: 27 },
  heroText: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  heroMeta: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 15 },
  heroMetaText: { fontSize: 11, fontWeight: '700' },
  loader: { marginTop: 60 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 25 },
  summaryRow: { flexDirection: 'row', gap: 9 },
  summaryCard: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 14,
  },
  summaryValue: { fontSize: 25, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  analysisCard: { borderRadius: 20, borderWidth: 1, marginTop: 16, padding: 17 },
  analysisHeading: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  sparkle: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  analysisHeadingCopy: { flex: 1 },
  analysisTitle: { fontSize: 17, fontWeight: '800' },
  analysisSubtitle: { fontSize: 12, marginTop: 2 },
  measurementList: { marginBottom: 17, marginTop: 12 },
  measurementRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
  },
  measurementCopy: { flex: 1 },
  measurementName: { fontSize: 13, fontWeight: '700' },
  measurementDate: { fontSize: 10, marginTop: 3 },
  measurementResult: { alignItems: 'flex-end' },
  measurementValue: { fontSize: 13, fontWeight: '700' },
  measurementStatus: { fontSize: 10, fontWeight: '800', marginTop: 3 },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 13,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    padding: 15,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.75 },
  results: { gap: 12, marginTop: 25 },
  resultsHeading: { alignItems: 'center', flexDirection: 'row', gap: 11, marginBottom: 2 },
  resultCard: { borderRadius: 18, borderWidth: 1, padding: 17 },
  resultTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  resultTitle: { flex: 1, fontSize: 16, fontWeight: '800' },
  resultNumber: { fontSize: 15, fontWeight: '800' },
  resultMeaning: { fontSize: 13, lineHeight: 19, marginTop: 9 },
  summaryTextCard: { borderRadius: 13, padding: 14 },
  summaryText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  interpretation: { borderRadius: 10, marginTop: 12, padding: 11 },
  interpretationText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  suggestionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  suggestionRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 5 },
  suggestionText: { flex: 1, fontSize: 12, lineHeight: 18 },
  professionalAdvice: { fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 12 },
  safetyNote: {
    alignItems: 'flex-start',
    borderRadius: 13,
    flexDirection: 'row',
    gap: 9,
    padding: 13,
  },
  safetyText: { flex: 1, fontSize: 11, lineHeight: 17 },
  empty: { alignItems: 'center', borderRadius: 20, borderWidth: 1, marginTop: 24, padding: 25 },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 15 },
  emptyText: { fontSize: 13, lineHeight: 20, marginBottom: 19, marginTop: 7, textAlign: 'center' },
});
