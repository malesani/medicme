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
import { useFocusEffect } from 'expo-router';

import { MiniChart } from '@/components/mini-chart';
import { useColors } from '@/hooks/use-colors';
import {
  createExamMeasurement,
  listMeasurements,
  listMetricDefinitions,
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
      const rows = byCode.get(measurement.metric_code) ?? [];
      rows.push(measurement);
      byCode.set(measurement.metric_code, rows);
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
      Alert.alert('Revisa los datos', 'Indica un nombre y un valor numérico.');
      return;
    }
    if (
      (min !== null && !Number.isFinite(min)) ||
      (max !== null && !Number.isFinite(max)) ||
      (min !== null && max !== null && min >= max)
    ) {
      Alert.alert(
        'Rango no válido',
        'Los límites deben ser numéricos y el mínimo debe ser menor que el máximo.'
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
            <Text style={[styles.title, { color: colors.text }]}>Mis valores</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Seguimiento de tus indicadores
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
            Los rangos son informativos y pueden variar según el laboratorio. No constituyen un
            diagnóstico médico.
          </Text>
        </View>

        {showForm ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Registrar valor</Text>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Tipo de valor</Text>
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
                  + Personalizado
                </Text>
              </Pressable>
            </ScrollView>
            <TextInput
              editable={selectedDefinition === null}
              onChangeText={setName}
              placeholder="Tipo de valor (ej. Glucosa)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={name}
            />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Resultado y unidad
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                inputMode="decimal"
                onChangeText={setValue}
                placeholder="Valor"
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
                placeholder="Unidad"
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
                Rango de este resultado
              </Text>
              <Text style={[styles.optionalLabel, { color: colors.mutedForeground }]}>
                Opcional
              </Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                inputMode="decimal"
                onChangeText={setRangeMin}
                placeholder="Mínimo"
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
                placeholder="Máximo"
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
                Puedes adaptar este rango al informe. Solo se guardará en este resultado.
              </Text>
            </View>
            <Pressable
              disabled={saving}
              onPress={save}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar valor'}</Text>
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin valores registrados</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Añade tu primer resultado para comenzar el seguimiento.
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

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            Ant: {group.previous.value} {group.previous.unit}
          </Text>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.status, { backgroundColor: statusBackground }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {outsideRange ? 'Fuera de rango' : hasRange ? 'En rango' : 'Sin rango'}
          </Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
          {new Date(group.latest.captured_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
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
