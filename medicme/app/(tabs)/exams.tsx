import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Button, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { createExam, listExams, type Exam } from '@/db';

export default function ExamsScreen() {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listExams();
      setExams(rows);
    } finally {
      setLoading(false);
    }
  };

  const addQuick = async () => {
    setLoading(true);
    try {
      await createExam({
        date: new Date().toISOString(),
        type: 'blood',
        notes: 'Creado desde Exámenes',
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  // Recarga cuando vuelves a la tab
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
          <ThemedText type="title">Exámenes</ThemedText>
          <ThemedText style={styles.muted}>
            {loading ? 'Cargando…' : `${exams.length} registro(s)`}
          </ThemedText>
        </ThemedView>
      }>
      <ThemedView style={styles.actions}>
        <Button title="Refrescar" onPress={load} disabled={loading} />
        <Button title="+ Añadir" onPress={addQuick} disabled={loading} />
      </ThemedView>

      <ThemedView style={{ gap: 10 }}>
        {exams.length === 0 ? (
          <ThemedText style={styles.muted}>Todavía no hay exámenes.</ThemedText>
        ) : (
          exams.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => {
                // Próximo paso: navegar a detalle
                // router.push(`/exams/${e.id}`)
                alert(`Examen: ${e.type}\n${new Date(e.date).toLocaleString()}`);
              }}
              style={styles.item}
            >
              <ThemedText type="defaultSemiBold">{e.type}</ThemedText>
              <ThemedText style={styles.muted}>
                {new Date(e.date).toLocaleString()}
              </ThemedText>
              {e.notes ? <ThemedText style={styles.muted}>{e.notes}</ThemedText> : null}
            </Pressable>
          ))
        )}
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  item: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  muted: {
    opacity: 0.7,
  },
});