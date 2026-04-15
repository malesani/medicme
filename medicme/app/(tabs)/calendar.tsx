import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Button, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { getDb } from '@/db';

type CalendarEvent = {
  id: string;
  scheduled_at: string;
  type: string;
  notes: string | null;
  reminder_minutes: number | null;
};

export default function CalendarScreen() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const nowIso = new Date().toISOString();

      const rows = await db.getAllAsync<CalendarEvent>(
        `SELECT id, scheduled_at, type, notes, reminder_minutes
         FROM calendar_events
         WHERE deleted_at IS NULL AND scheduled_at >= ?
         ORDER BY scheduled_at ASC;`,
        [nowIso]
      );

      setEvents(rows);
    } finally {
      setLoading(false);
    }
  };

  const addDemoEvent = async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const now = new Date().toISOString();

      // +14 días
      const scheduled = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      await db.runAsync(
        `INSERT INTO calendar_events
         (id, scheduled_at, type, notes, reminder_minutes, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL);`,
        [randomUUID(), scheduled, 'blood', 'Recordatorio demo', 60, now, now]
      );

      await load();
      alert('Evento creado ✅');
    } catch (e) {
      console.error(e);
      alert('Error creando evento');
    } finally {
      setLoading(false);
    }
  };

  const softDeleteEvent = async (id: string) => {
    setLoading(true);
    try {
      const db = await getDb();
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE calendar_events
         SET deleted_at = ?, updated_at = ?
         WHERE id = ?;`,
        [now, now, id]
      );

      await load();
    } finally {
      setLoading(false);
    }
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
          <ThemedText type="title">Calendario</ThemedText>
          <ThemedText style={styles.muted}>
            {loading ? 'Cargando…' : `${events.length} próximo(s)`}
          </ThemedText>
        </ThemedView>
      }>
      <ThemedView style={styles.actions}>
        <Button title="Refrescar" onPress={load} disabled={loading} />
        <Button title="+ Evento demo" onPress={addDemoEvent} disabled={loading} />
      </ThemedView>

      <ThemedView style={{ gap: 10 }}>
        {events.length === 0 ? (
          <ThemedText style={styles.muted}>No hay exámenes futuros programados.</ThemedText>
        ) : (
          events.map((ev) => (
            <Pressable
              key={ev.id}
              onLongPress={() => softDeleteEvent(ev.id)}
              style={styles.item}
            >
              <ThemedText type="defaultSemiBold">{ev.type}</ThemedText>
              <ThemedText style={styles.muted}>
                {new Date(ev.scheduled_at).toLocaleString()}
              </ThemedText>
              {ev.notes ? <ThemedText style={styles.muted}>{ev.notes}</ThemedText> : null}
              <ThemedText style={styles.hint}>
                Mantén presionado para “borrar” (soft delete)
              </ThemedText>
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
  hint: {
    opacity: 0.55,
    marginTop: 6,
    fontSize: 12,
  },
});