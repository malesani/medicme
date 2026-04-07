import { Image } from 'expo-image';
import { Platform, StyleSheet, Button, TextInput, Alert } from 'react-native';
import { useState } from 'react';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import {
  createExam,
  addAttachment,
  listExams,
  addMeasurement,
  listLatestMeasurements,
  type Exam,
  type Measurement,
} from '../../db';

export default function HomeScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [latestValues, setLatestValues] = useState<Measurement[]>([]);
  const [metricName, setMetricName] = useState('');
  const [metricResult, setMetricResult] = useState('');
  const [metricUnit, setMetricUnit] = useState('');

  const onCreateExam = async () => {
    await createExam({
      date: new Date().toISOString(),
      type: 'blood',
      notes: 'Primer examen',
    });
    setExams(await listExams());
  };

  const onLoadExams = async () => {
    setExams(await listExams());
  };

  const onSaveMetric = async () => {
    const parsedValue = Number(metricResult);

    if (!metricName.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del valor (ej: glucosa).');
      return;
    }

    if (Number.isNaN(parsedValue)) {
      Alert.alert('Resultado inválido', 'Escribe un número válido para el resultado.');
      return;
    }

    const now = new Date().toISOString();
    const exam = await createExam({
      date: now,
      type: 'blood',
      notes: `Carga manual: ${metricName.trim()}`,
    });

    await addMeasurement({
      examId: exam.id,
      metricCode: metricName,
      value: parsedValue,
      unit: metricUnit,
      capturedAt: now,
    });

    setMetricName('');
    setMetricResult('');
    setMetricUnit('');

    setLatestValues(await listLatestMeasurements());
    setExams(await listExams());
    Alert.alert('Guardado', 'El valor se guardó correctamente.');
  };

  const onLoadDashboard = async () => {
    setLatestValues(await listLatestMeasurements());
  };
  const onPickFile = async () => {
    try {
      // 1️⃣ Crear un examen primero (temporal)
      const exam = await createExam({
        date: new Date().toISOString(),
        type: "blood",
        notes: "Examen con archivo",
      });

      // 2️⃣ Abrir selector
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // 3️⃣ Crear carpeta interna si no existe
      const dir = FileSystem.documentDirectory + "exams/";
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      // 4️⃣ Definir nueva ruta
      const newPath = dir + file.name;

      // 5️⃣ Copiar archivo al storage interno
      await FileSystem.copyAsync({
        from: file.uri,
        to: newPath,
      });

      // 6️⃣ Guardar metadata en SQLite
      await addAttachment({
        examId: exam.id,
        path: newPath,
        mimeType: file.mimeType ?? "application/pdf",
        size: file.size,
      });

      alert("Archivo guardado correctamente 🎉");
    } catch (e) {
      console.error(e);
      alert("Error al guardar archivo");
    }
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      {/* ✅ DB TEST */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Dashboard de sangre (SQLite)</ThemedText>

        <ThemedText>Agregar valor manual</ThemedText>
        <TextInput
          value={metricName}
          onChangeText={setMetricName}
          placeholder="Nombre (ej: glucosa)"
          style={styles.input}
        />
        <TextInput
          value={metricResult}
          onChangeText={setMetricResult}
          placeholder="Resultado (ej: 96)"
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={metricUnit}
          onChangeText={setMetricUnit}
          placeholder="Unidad opcional (ej: mg/dL)"
          style={styles.input}
        />
        <Button title="Guardar valor manual" onPress={onSaveMetric} />

        <ThemedView style={{ gap: 8 }}>
          <Button title="Crear examen" onPress={onCreateExam} />
          <Button title="Cargar exámenes" onPress={onLoadExams} />
          <Button title="Cargar últimos valores" onPress={onLoadDashboard} />
        </ThemedView>

        <Button title="Subir PDF" onPress={onPickFile} />

        <ThemedView style={{ marginTop: 12, gap: 6 }}>
          <ThemedText type="defaultSemiBold">Últimos valores por indicador</ThemedText>
          {latestValues.length === 0 ? (
            <ThemedText>Aún no hay valores registrados.</ThemedText>
          ) : (
            latestValues.map((m) => (
              <ThemedText key={m.id}>
                • {m.metric_code}: {m.value} {m.unit || '(sin unidad)'} —{' '}
                {new Date(m.captured_at).toLocaleString()}
              </ThemedText>
            ))
          )}
        </ThemedView>

        <ThemedView style={{ marginTop: 12, gap: 6 }}>
          {exams.length === 0 ? (
            <ThemedText>No hay exámenes todavía.</ThemedText>
          ) : (
            exams.map((e) => (
              <ThemedText key={e.id}>
                • {e.type} — {new Date(e.date).toLocaleString()}
              </ThemedText>
            ))
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#9aa0a6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
