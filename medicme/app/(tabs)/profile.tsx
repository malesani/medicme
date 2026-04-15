import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Button, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { getDb } from '@/db';

type Counts = {
  exams: number;
  attachments: number;
  measurements: number;
  upcoming: number;
};

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    exams: 0,
    attachments: 0,
    measurements: 0,
    upcoming: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const nowIso = new Date().toISOString();

      const examsRow = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM exams WHERE deleted_at IS NULL;`
      );
      const attRow = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM attachments WHERE deleted_at IS NULL;`
      );
      const measRow = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM measurements;`
      );
      const upRow = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c
         FROM calendar_events
         WHERE deleted_at IS NULL AND scheduled_at > ?;`,
        [nowIso]
      );

      setCounts({
        exams: examsRow?.c ?? 0,
        attachments: attRow?.c ?? 0,
        measurements: measRow?.c ?? 0,
        upcoming: upRow?.c ?? 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAllDemo = async () => {
    Alert.alert(
      'Reset',
      'Esto borrará TODOS los datos locales (exámenes, PDFs/metadata, mediciones, eventos). ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const db = await getDb();
              await db.execAsync(`PRAGMA foreign_keys = ON;`);

              // Orden importa por FK
              await db.execAsync(`DELETE FROM attachments;`);
              await db.execAsync(`DELETE FROM measurements;`);
              await db.execAsync(`DELETE FROM calendar_events;`);
              await db.execAsync(`DELETE FROM exams;`);

              await load();
              Alert.alert('Listo', 'Datos locales borrados ✅');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo borrar');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [])
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <ThemedView style={styles.header}>
          <ThemedText type="title">Perfil</ThemedText>
          <ThemedText style={styles.muted}>
            {loading ? 'Cargando…' : 'Datos locales'}
          </ThemedText>
        </ThemedView>
      }>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Resumen</ThemedText>

        <ThemedView style={styles.row}>
          <ThemedText type="defaultSemiBold">Exámenes</ThemedText>
          <ThemedText>{counts.exams}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.row}>
          <ThemedText type="defaultSemiBold">Documentos (PDFs)</ThemedText>
          <ThemedText>{counts.attachments}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.row}>
          <ThemedText type="defaultSemiBold">Mediciones</ThemedText>
          <ThemedText>{counts.measurements}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.row}>
          <ThemedText type="defaultSemiBold">Eventos futuros</ThemedText>
          <ThemedText>{counts.upcoming}</ThemedText>
        </ThemedView>

        <ThemedView style={{ marginTop: 12 }}>
          <Button title="Refrescar" onPress={load} disabled={loading} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Desarrollo</ThemedText>
        <ThemedText style={styles.muted}>
          Útil mientras iteramos el modelo de datos.
        </ThemedText>

        <ThemedView style={{ marginTop: 10 }}>
          <Button title="Reset (borrar todo local)" onPress={resetAllDemo} disabled={loading} />
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 178,
    justifyContent: 'flex-end',
    padding: 16,
  },
  card: {
    gap: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  muted: {
    opacity: 0.7,
  },
});