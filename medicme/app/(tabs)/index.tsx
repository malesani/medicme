import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  createExamMeasurement,
  listMeasurements,
  type Measurement,
} from '../../db';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [metricName, setMetricName] = useState('');
  const [metricResult, setMetricResult] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadMeasurements = useCallback(async () => {
    try {
      setMeasurements(await listMeasurements());
    } catch (error) {
      console.error('Error loading measurements:', error);
      setFeedback({
        type: 'error',
        message: 'No se pudieron cargar los valores guardados.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMeasurements();
    }, [loadMeasurements])
  );

  const resetForm = () => {
    setMetricName('');
    setMetricResult('');
    setMetricUnit('');
    setShowForm(false);
  };

  const onSaveMetric = async () => {
    const normalizedResult = metricResult.trim().replace(',', '.');
    const parsedValue = Number(normalizedResult);

    if (!metricName.trim()) {
      setFeedback({
        type: 'error',
        message: 'Escribe el nombre del valor, por ejemplo T3.',
      });
      return;
    }

    if (!normalizedResult || !Number.isFinite(parsedValue)) {
      setFeedback({
        type: 'error',
        message: 'Escribe un resultado numérico válido.',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await createExamMeasurement({
        metricCode: metricName,
        value: parsedValue,
        unit: metricUnit,
      });

      resetForm();
      await loadMeasurements();
      setFeedback({
        type: 'success',
        message: `${metricName.trim().toUpperCase()} se guardó correctamente.`,
      });
    } catch (error) {
      console.error('Error saving measurement:', error);
      const message =
        error instanceof Error ? error.message : 'Error desconocido al guardar.';
      setFeedback({
        type: 'error',
        message: `No se pudo guardar el valor: ${message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <ThemedText type="title">Mis valores</ThemedText>
            <ThemedText style={styles.secondaryText}>
              Resultados guardados de tus exámenes.
            </ThemedText>
          </View>
          {!showForm && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowForm(true)}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: tintColor, opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText
                lightColor={Palette.white}
                darkColor={Palette.white}
                style={styles.addButtonText}>
                + Añadir valor
              </ThemedText>
            </Pressable>
          )}
        </View>

        {feedback && (
          <View
            accessibilityRole="alert"
            style={[
              styles.feedback,
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ]}>
            <ThemedText
              style={[
                styles.feedbackText,
                feedback.type === 'success'
                  ? styles.feedbackSuccessText
                  : styles.feedbackErrorText,
              ]}>
              {feedback.message}
            </ThemedText>
          </View>
        )}

        {showForm && (
          <ThemedView
            style={styles.form}
            lightColor={Palette.white}
            darkColor={Palette.white}>
            <ThemedText type="subtitle">Nuevo valor</ThemedText>

            <ThemedText type="defaultSemiBold">Valor</ThemedText>
            <TextInput
              autoCapitalize="characters"
              editable={!saving}
              onChangeText={setMetricName}
              placeholder="Ejemplo: T3"
              placeholderTextColor={Palette.textSecondary}
              style={styles.input}
              value={metricName}
            />

            <ThemedText type="defaultSemiBold">Resultado</ThemedText>
            <TextInput
              editable={!saving}
              inputMode="decimal"
              onChangeText={setMetricResult}
              placeholder="Ejemplo: 50"
              placeholderTextColor={Palette.textSecondary}
              style={styles.input}
              value={metricResult}
            />

            <ThemedText type="defaultSemiBold">Unidad (opcional)</ThemedText>
            <TextInput
              editable={!saving}
              onChangeText={setMetricUnit}
              placeholder="Ejemplo: ng/dL"
              placeholderTextColor={Palette.textSecondary}
              style={styles.input}
              value={metricUnit}
            />

            <View style={styles.formActions}>
              <Pressable
                disabled={saving}
                onPress={resetForm}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={onSaveMetric}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: tintColor },
                  (pressed || saving) && styles.pressed,
                ]}>
                <ThemedText
                  lightColor={Palette.white}
                  darkColor={Palette.white}
                  type="defaultSemiBold">
                  {saving ? 'Guardando…' : 'Guardar'}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        )}

        {loading ? (
          <ActivityIndicator color={tintColor} size="large" style={styles.loader} />
        ) : measurements.length === 0 ? (
          <ThemedView
            style={styles.emptyState}
            lightColor={Palette.softBlue}
            darkColor={Palette.softBlue}>
            <ThemedText type="subtitle">Todavía no hay valores</ThemedText>
            <ThemedText style={styles.secondaryText}>
              Usa “Añadir valor” para registrar el primer resultado.
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.list}>
            {measurements.map((measurement) => (
              <ThemedView
                key={measurement.id}
                style={styles.card}
                lightColor={Palette.softBlue}
                darkColor={Palette.softBlue}>
                <View style={styles.cardTop}>
                  <ThemedText type="subtitle">
                    {measurement.metric_code.toUpperCase()}
                  </ThemedText>
                  <ThemedText style={[styles.result, { color: tintColor }]}>
                    {measurement.value} {measurement.unit}
                  </ThemedText>
                </View>
                <ThemedText style={styles.date}>
                  {new Date(measurement.captured_at).toLocaleString()}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 64,
  },
  header: {
    gap: 18,
    marginBottom: 24,
  },
  headerCopy: {
    gap: 6,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  secondaryText: {
    color: Palette.textSecondary,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  form: {
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 24,
    padding: 18,
  },
  feedback: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackSuccess: {
    backgroundColor: Palette.successBackground,
    borderColor: Palette.success,
  },
  feedbackError: {
    backgroundColor: Palette.errorBackground,
    borderColor: Palette.error,
  },
  feedbackText: {
    fontWeight: '600',
  },
  feedbackSuccessText: {
    color: Palette.health,
  },
  feedbackErrorText: {
    color: Palette.error,
  },
  input: {
    backgroundColor: Palette.white,
    borderColor: Palette.border,
    borderRadius: 10,
    borderWidth: 1,
    color: Palette.text,
    fontSize: 16,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  secondaryButton: {
    borderColor: Palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  saveButton: {
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.65,
  },
  loader: {
    marginTop: 60,
  },
  emptyState: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 30,
  },
  list: {
    gap: 12,
  },
  card: {
    borderColor: Palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  result: {
    fontSize: 20,
    fontWeight: '700',
  },
  date: {
    color: Palette.textSecondary,
    fontSize: 13,
  },
});
