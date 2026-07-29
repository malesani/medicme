import { Feather } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { MiniChart } from '@/components/mini-chart';
import { useLanguage } from '@/context/language-context';
import { useColors } from '@/hooks/use-colors';
import {
  createExamMeasurement,
  listMeasurements,
  listMetricDefinitions,
  normalizeMetricCode,
  type Measurement,
  type MetricDefinition,
} from '@/db';

type MetricGroup = {
  code: string;
  latest: Measurement;
  previous?: Measurement;
  history: number[];
};

export default function ValuesScreen() {
  const colors = useColors();
  const { tr } = useLanguage();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [definitions, setDefinitions] = useState<MetricDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [storedMeasurements, storedDefinitions] = await Promise.all([
        listMeasurements(),
        listMetricDefinitions(),
      ]);
      setMeasurements(storedMeasurements);
      setDefinitions(storedDefinitions);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const groups = useMemo(() => {
    const byCode = new Map<string, Measurement[]>();
    for (const measurement of measurements) {
      const normalizedCode = normalizeMetricCode(measurement.metric_code);
      const rows = byCode.get(normalizedCode) ?? [];
      rows.push(measurement);
      byCode.set(normalizedCode, rows);
    }
    return Array.from(byCode.entries()).map<MetricGroup>(([code, rows]) => ({
      code,
      latest: rows[0],
      previous: rows[1],
      history: [...rows].reverse().map((row) => row.value),
    }));
  }, [measurements]);

  const save = async () => {
    const numericValue = Number(value.replace(',', '.'));
    const normalizedMin = rangeMin.trim().replace(',', '.');
    const normalizedMax = rangeMax.trim().replace(',', '.');
    const min = normalizedMin ? Number(normalizedMin) : null;
    const max = normalizedMax ? Number(normalizedMax) : null;
    if (!name.trim() || !Number.isFinite(numericValue)) {
      Alert.alert(
        tr('Revisa los datos', 'Controlla i dati', 'Check the data'),
        tr('Indica un nombre y un valor numérico.', 'Inserisci un nome e un valore numerico.', 'Enter a name and a numeric value.')
      );
      return;
    }
    if (
      (min !== null && !Number.isFinite(min)) ||
      (max !== null && !Number.isFinite(max)) ||
      (min !== null && max !== null && min >= max)
    ) {
      Alert.alert(
        tr('Rango no válido', 'Intervallo non valido', 'Invalid range'),
        tr('Los límites deben ser numéricos y el mínimo debe ser menor que el máximo.', 'I limiti devono essere numerici e il minimo deve essere inferiore al massimo.', 'The limits must be numeric and the minimum must be lower than the maximum.')
      );
      return;
    }
    try {
      setSaving(true);
      await createExamMeasurement({
        metricCode: selectedDefinition ?? name,
        value: numericValue,
        unit,
        rangeMin: min,
        rangeMax: max,
      });
      setName('');
      setValue('');
      setUnit('');
      setRangeMin('');
      setRangeMax('');
      setSelectedDefinition(null);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const selectDefinition = (definition: MetricDefinition) => {
    setSelectedDefinition(definition.code);
    setName(definition.label);
    setUnit(definition.default_unit);
    setRangeMin(definition.default_min?.toString() ?? '');
    setRangeMax(definition.default_max?.toString() ?? '');
  };

  const selectCustom = () => {
    setSelectedDefinition(null);
    setName('');
    setUnit('');
    setRangeMin('');
    setRangeMax('');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{tr('Mis valores', 'I miei valori', 'My values')}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {tr('Seguimiento de tus indicadores', 'Monitoraggio dei tuoi indicatori', 'Track your indicators')}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowForm((current) => !current)}
            style={[styles.headerButton, { backgroundColor: colors.primary }]}>
            <Feather color="#FFFFFF" name={showForm ? 'x' : 'plus'} size={22} />
          </Pressable>
        </View>

        <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight }]}>
          <Feather color={colors.primary} name="info" size={17} />
          <Text style={[styles.disclaimerText, { color: colors.primary }]}>
            {tr('Los rangos son informativos y pueden variar según el laboratorio. No constituyen un diagnóstico médico.', 'Gli intervalli sono indicativi e possono variare in base al laboratorio. Non costituiscono una diagnosi medica.', 'Ranges are informational and may vary by laboratory. They are not a medical diagnosis.')}
          </Text>
        </View>

        {showForm ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{tr('Registrar valor', 'Registra valore', 'Add value')}</Text>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{tr('Tipo de valor', 'Tipo di valore', 'Value type')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.definitionList}>
              {definitions.map((definition) => {
                const active = selectedDefinition === definition.code;
                return (
                  <Pressable
                    key={definition.code}
                    onPress={() => selectDefinition(definition)}
                    style={[
                      styles.definitionChip,
                      {
                        backgroundColor: active ? colors.primary : colors.muted,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.definitionText,
                        { color: active ? '#FFFFFF' : colors.mutedForeground },
                      ]}>
                      {definition.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={selectCustom}
                style={[
                  styles.definitionChip,
                  {
                    backgroundColor:
                      selectedDefinition === null ? colors.primary : colors.muted,
                    borderColor:
                      selectedDefinition === null ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.definitionText,
                    {
                      color:
                        selectedDefinition === null ? '#FFFFFF' : colors.mutedForeground,
                    },
                  ]}>
                  {tr('+ Personalizado', '+ Personalizzato', '+ Custom')}
                </Text>
              </Pressable>
            </ScrollView>
            <TextInput
              editable={selectedDefinition === null}
              onChangeText={setName}
              placeholder={tr('Tipo de valor (ej. Glucosa)', 'Tipo di valore (es. Glucosio)', 'Value type (e.g. Glucose)')}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={name}
            />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {tr('Resultado y unidad', 'Risultato e unità', 'Result and unit')}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                inputMode="decimal"
                onChangeText={setValue}
                placeholder={tr('Valor', 'Valore', 'Value')}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  styles.valueInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                value={value}
              />
              <TextInput
                onChangeText={setUnit}
                placeholder={tr('Unidad', 'Unità', 'Unit')}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  styles.unitInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                value={unit}
              />
            </View>
            <View style={styles.rangeHeading}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {tr('Rango de este resultado', 'Intervallo di questo risultato', 'Range for this result')}
              </Text>
              <Text style={[styles.optionalLabel, { color: colors.mutedForeground }]}>
                {tr('Opcional', 'Opzionale', 'Optional')}
              </Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                inputMode="decimal"
                onChangeText={setRangeMin}
                placeholder={tr('Mínimo', 'Minimo', 'Minimum')}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  styles.valueInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                value={rangeMin}
              />
              <TextInput
                inputMode="decimal"
                onChangeText={setRangeMax}
                placeholder={tr('Máximo', 'Massimo', 'Maximum')}
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  styles.unitInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                value={rangeMax}
              />
            </View>
            <View style={[styles.rangeNotice, { backgroundColor: colors.primaryLight }]}>
              <Feather color={colors.primary} name="info" size={14} />
              <Text style={[styles.rangeNoticeText, { color: colors.primary }]}>
                {tr('Puedes adaptar este rango al informe. Solo se guardará en este resultado.', 'Puoi adattare questo intervallo al referto. Verrà salvato solo in questo risultato.', 'You can adapt this range to the report. It will only be saved with this result.')}
              </Text>
            </View>
            <Pressable
              disabled={saving}
              onPress={save}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveText}>{saving ? tr('Guardando…', 'Salvataggio…', 'Saving…') : tr('Guardar valor', 'Salva valore', 'Save value')}</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : groups.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather color={colors.mutedForeground} name="activity" size={28} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{tr('Sin valores registrados', 'Nessun valore registrato', 'No values recorded')}</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {tr('Añade tu primer resultado para comenzar el seguimiento.', 'Aggiungi il primo risultato per iniziare il monitoraggio.', 'Add your first result to start tracking.')}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {groups.map((group) => (
              <ValueCard group={group} key={group.code} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ValueCard({ group }: { group: MetricGroup }) {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const trend =
    group.previous === undefined
      ? 'minus'
        : group.latest.value >= group.previous.value
        ? 'trending-up'
        : 'trending-down';
  const hasRange = group.latest.range_min !== null || group.latest.range_max !== null;
  const outsideRange =
    (group.latest.range_min !== null && group.latest.value < group.latest.range_min) ||
    (group.latest.range_max !== null && group.latest.value > group.latest.range_max);
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

  const openExam = () => {
    if (!group.latest.exam_id) return;
    router.push({ pathname: '/examen/[id]', params: { id: group.latest.exam_id } });
  };

  return (
    <Pressable
      accessibilityRole={group.latest.exam_id ? 'button' : undefined}
      onPress={openExam}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && group.latest.exam_id && styles.pressed,
      ]}>
      <View style={styles.cardHeader}>
        <Text numberOfLines={1} style={[styles.metricLabel, { color: colors.mutedForeground }]}>
          {group.code
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase())}
        </Text>
        <Feather color={colors.secondary} name={trend} size={16} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.metricValue, { color: colors.text }]}>{group.latest.value}</Text>
        <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>
          {group.latest.unit}
        </Text>
      </View>
      <View style={styles.chartRow}>
        <MiniChart color={colors.secondary} values={group.history} />
        {group.previous ? (
          <Text style={[styles.previous, { color: colors.mutedForeground }]}>
              {tr('Prec:', 'Prec:', 'Prev:')} {group.previous.value} {group.previous.unit}
          </Text>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.status, { backgroundColor: statusBackground }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
              {outsideRange ? tr('Fuera de rango', 'Fuori intervallo', 'Out of range') : hasRange ? tr('En rango', 'Nell’intervallo', 'In range') : tr('Sin rango', 'Senza intervallo', 'No range')}
          </Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {new Date(group.latest.captured_at).toLocaleDateString(locale)}
        </Text>
      </View>
      {group.latest.exam_id ? (
        <View style={[styles.examLink, { borderTopColor: colors.border }]}>
          <Feather color={colors.primary} name="file-text" size={14} />
          <Text style={[styles.examLinkText, { color: colors.primary }]}>
              {tr('Ver examen y documentos', 'Vedi esame e documenti', 'View exam and documents')}
          </Text>
          <Feather color={colors.primary} name="chevron-right" size={15} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingBottom: 42,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 3 },
  headerButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  disclaimer: {
    alignItems: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 20,
    padding: 13,
  },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  form: { borderRadius: 16, borderWidth: 1, gap: 11, marginBottom: 20, padding: 16 },
  formTitle: { fontSize: 18, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '700' },
  definitionList: { gap: 8, paddingRight: 4 },
  definitionChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  definitionText: { fontSize: 12, fontWeight: '700' },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 15, padding: 12 },
  inputRow: { flexDirection: 'row', gap: 10, width: '100%' },
  valueInput: { flex: 3, minWidth: 0 },
  unitInput: { flex: 2, minWidth: 0 },
  rangeHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  optionalLabel: { fontSize: 11 },
  rangeNotice: {
    alignItems: 'flex-start',
    borderRadius: 9,
    flexDirection: 'row',
    gap: 7,
    padding: 10,
  },
  rangeNoticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  saveButton: { alignItems: 'center', borderRadius: 10, padding: 13 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  loader: { marginTop: 60 },
  grid: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    minHeight: 160,
    padding: 15,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metricLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  valueRow: { alignItems: 'baseline', flexDirection: 'row', gap: 4, marginBottom: 9 },
  metricValue: { fontSize: 30, fontWeight: '800', lineHeight: 34 },
  metricUnit: { fontSize: 13, fontWeight: '500' },
  chartRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 34,
  },
  previous: { fontSize: 11 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  status: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusDot: { borderRadius: 3, height: 6, width: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11 },
  examLink: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
  },
  examLinkText: { flex: 1, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 52 },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 7 },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
