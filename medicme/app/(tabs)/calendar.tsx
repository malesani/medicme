import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/use-colors';
import { useLanguage } from '@/context/language-context';
import { safeLogger } from '@/utils/safe-logger';
import { getDb } from '@/db';

type CalendarEvent = {
  id: string;
  scheduled_at: string;
  type: string;
  notes: string | null;
  reminder_minutes: number | null;
};

export default function CalendarScreen() {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const weekDays = tr('L,M,X,J,V,S,D', 'L,M,M,G,V,S,D', 'M,T,W,T,F,S,S').split(',');
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const load = useCallback(async () => {
    try {
      const db = await getDb();
      setEvents(
        await db.getAllAsync<CalendarEvent>(
          `SELECT id, scheduled_at, type, notes, reminder_minutes
           FROM calendar_events
           WHERE deleted_at IS NULL
           ORDER BY scheduled_at ASC;`
        )
      );
    } catch {
      safeLogger.error('Appointments loading failed', { code: 'APPOINTMENTS_LOAD_FAILED' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const upcomingEvents = useMemo(
    () => events.filter((event) => new Date(event.scheduled_at) >= new Date()),
    [events]
  );

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekDay }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  const eventDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    return new Set(
      events
        .map((event) => new Date(event.scheduled_at))
        .filter((date) => date.getFullYear() === year && date.getMonth() === month)
        .map((date) => date.getDate())
    );
  }, [events, visibleMonth]);

  const resetForm = () => {
    setEventType('');
    setNotes('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setScheduledDate(tomorrow);
    setScheduledTime('09:00');
    setShowForm(false);
  };

  const addEvent = async () => {
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(scheduledTime.trim());
    if (!eventType.trim() || !timeMatch) {
      Alert.alert(tr('Revisa los datos', 'Controlla i dati', 'Check the data'), tr('Indica un nombre y una hora válida en formato HH:MM.', 'Inserisci un nome e un orario valido nel formato HH:MM.', 'Enter a name and valid time in HH:MM format.'));
      return;
    }

    const scheduled = new Date(scheduledDate);
    scheduled.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    if (scheduled <= new Date()) {
      Alert.alert(tr('Fecha no válida', 'Data non valida', 'Invalid date'), tr('La cita debe programarse para una fecha y hora futuras.', 'L’appuntamento deve essere programmato per una data e un’ora future.', 'The appointment must be scheduled for a future date and time.'));
      return;
    }

    try {
      setSaving(true);
      const db = await getDb();
      const now = new Date();
      await db.runAsync(
        `INSERT INTO calendar_events
         (id, scheduled_at, type, notes, reminder_minutes, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL);`,
        [
          randomUUID(),
          scheduled.toISOString(),
          eventType.trim(),
          notes.trim() || null,
          60,
          now.toISOString(),
          now.toISOString(),
        ]
      );
      resetForm();
      await load();
    } catch {
      safeLogger.error('Appointment creation failed', { code: 'APPOINTMENT_CREATE_FAILED' });
      Alert.alert(tr('Error', 'Errore', 'Error'), tr('No se pudo guardar la cita.', 'Impossibile salvare l’appuntamento.', 'The appointment could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = (event: CalendarEvent) => {
    Alert.alert(tr('Eliminar cita', 'Elimina appuntamento', 'Delete appointment'), tr(`¿Quieres eliminar “${event.type}”?`, `Vuoi eliminare “${event.type}”?`, `Do you want to delete “${event.type}”?`), [
      { text: tr('Cancelar', 'Annulla', 'Cancel'), style: 'cancel' },
      {
        text: tr('Eliminar', 'Elimina', 'Delete'),
        style: 'destructive',
        onPress: async () => {
          const db = await getDb();
          const now = new Date().toISOString();
          await db.runAsync(
            `UPDATE calendar_events SET deleted_at = ?, updated_at = ? WHERE id = ?;`,
            [now, now, event.id]
          );
          await load();
        },
      },
    ]);
  };

  const changeMonth = (amount: number) => {
    setVisibleMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + amount, 1)
    );
  };

  const selectCalendarDay = (day: number) => {
    const selected = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day
    );
    setScheduledDate(selected);
    setShowForm(true);
  };

  const changeSelectedDate = (amount: number) => {
    setScheduledDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount);
      return next;
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              (Platform.OS === 'web' ? 20 : insets.top) +
              (Platform.OS === 'web' ? 4 : 10),
            paddingBottom: insets.bottom + 42,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{tr('Citas', 'Appuntamenti', 'Appointments')}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {tr('Organiza tus próximos controles', 'Organizza i tuoi prossimi controlli', 'Organize your upcoming checkups')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={showForm ? tr('Cerrar formulario', 'Chiudi modulo', 'Close form') : tr('Añadir cita', 'Aggiungi appuntamento', 'Add appointment')}
            onPress={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            style={[styles.headerButton, { backgroundColor: colors.primary }]}>
            <Feather color="#FFFFFF" name={showForm ? 'x' : 'plus'} size={22} />
          </Pressable>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Feather color={colors.mutedForeground} name="chevron-left" size={20} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {visibleMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Feather color={colors.mutedForeground} name="chevron-right" size={20} />
            </Pressable>
          </View>
          <View style={styles.calendarGrid}>
            {weekDays.map((day) => (
              <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>
                {day}
              </Text>
            ))}
            {calendarDays.map((day, index) => {
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                visibleMonth.getMonth() === today.getMonth() &&
                visibleMonth.getFullYear() === today.getFullYear();
              return (
                <View key={`${day ?? 'empty'}-${index}`} style={styles.dayCell}>
                  {day ? (
                    <Pressable
                      accessibilityLabel={`${tr('Seleccionar', 'Seleziona', 'Select')} ${day}`}
                      onPress={() => selectCalendarDay(day)}
                      style={[
                        styles.dayCircle,
                        scheduledDate.getDate() === day &&
                          scheduledDate.getMonth() === visibleMonth.getMonth() &&
                          scheduledDate.getFullYear() === visibleMonth.getFullYear() && {
                            borderColor: colors.primary,
                            borderWidth: 1,
                          },
                        isToday && { backgroundColor: colors.primary },
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          { color: isToday ? '#FFFFFF' : colors.text },
                        ]}>
                        {day}
                      </Text>
                      {eventDays.has(day) ? (
                        <View
                          style={[
                            styles.eventDot,
                            { backgroundColor: isToday ? '#FFFFFF' : colors.primary },
                          ]}
                        />
                      ) : null}
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {showForm ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{tr('Nueva cita', 'Nuovo appuntamento', 'New appointment')}</Text>
            <TextInput
              onChangeText={setEventType}
              placeholder={tr('Nombre de la cita o examen', 'Nome dell’appuntamento o dell’esame', 'Appointment or exam name')}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={eventType}
            />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{tr('Fecha', 'Data', 'Date')}</Text>
            <View style={[styles.dateSelector, { borderColor: colors.border }]}>
              <Pressable
                accessibilityLabel={tr('Día anterior', 'Giorno precedente', 'Previous day')}
                onPress={() => changeSelectedDate(-1)}
                style={styles.dateSelectorButton}>
                <Feather color={colors.mutedForeground} name="chevron-left" size={20} />
              </Pressable>
              <View style={styles.selectedDateCopy}>
                <Text style={[styles.selectedDate, { color: colors.text }]}>
                  {scheduledDate.toLocaleDateString(locale, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={[styles.selectedDateHint, { color: colors.mutedForeground }]}>
                  {tr('También puedes tocar un día del calendario', 'Puoi anche toccare un giorno del calendario', 'You can also tap a calendar day')}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={tr('Día siguiente', 'Giorno successivo', 'Next day')}
                onPress={() => changeSelectedDate(1)}
                style={styles.dateSelectorButton}>
                <Feather color={colors.mutedForeground} name="chevron-right" size={20} />
              </Pressable>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{tr('Hora', 'Ora', 'Time')}</Text>
            <View style={[styles.timeInputWrap, { borderColor: colors.border }]}>
              <Feather color={colors.mutedForeground} name="clock" size={18} />
              <TextInput
                inputMode="numeric"
                maxLength={5}
                onChangeText={setScheduledTime}
                placeholder="09:00"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.timeInput, { color: colors.text }]}
                value={scheduledTime}
              />
            </View>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder={tr('Centro, médico y preparación', 'Centro, medico e preparazione', 'Center, doctor and preparation')}
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.notesInput,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={notes}
            />
            <Pressable
              disabled={saving}
              onPress={addEvent}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveText}>{saving ? tr('Guardando…', 'Salvataggio…', 'Saving…') : tr('Guardar cita', 'Salva appuntamento', 'Save appointment')}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{tr('Próximas citas', 'Prossimi appuntamenti', 'Upcoming appointments')}</Text>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {upcomingEvents.length} {tr('pendientes', 'in programma', 'pending')}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : upcomingEvents.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather color={colors.mutedForeground} name="calendar" size={27} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{tr('No hay citas próximas', 'Nessun prossimo appuntamento', 'No upcoming appointments')}</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {tr('Añade tu próxima consulta o examen para recordarlo.', 'Aggiungi la prossima visita o esame per ricordarlo.', 'Add your next visit or exam as a reminder.')}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {upcomingEvents.map((event) => (
              <AppointmentCard event={event} key={event.id} locale={locale} onDelete={() => deleteEvent(event)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function AppointmentCard({
  event,
  locale,
  onDelete,
}: {
  event: CalendarEvent;
  locale: string;
  onDelete: () => void;
}) {
  const colors = useColors();
  const { tr } = useLanguage();
  const date = new Date(event.scheduled_at);
  return (
    <Pressable
      onLongPress={onDelete}
      style={({ pressed }) => [
        styles.appointmentCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.dateColumn, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.dayNumber, { color: colors.primary }]}>{date.getDate()}</Text>
        <Text style={[styles.monthShort, { color: colors.primary }]}>
          {date.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}
        </Text>
      </View>
      <View style={styles.appointmentInfo}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[styles.appointmentName, { color: colors.text }]}>
            {event.type}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
        </View>
        <View style={styles.metaRow}>
          <Feather color={colors.mutedForeground} name="clock" size={12} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={[styles.separator, { color: colors.border }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {date.toLocaleDateString(locale, { dateStyle: 'medium' })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Feather color={colors.mutedForeground} name="map-pin" size={12} />
          <Text numberOfLines={1} style={[styles.metaText, { color: colors.mutedForeground }]}>
              {event.notes || tr('Centro por confirmar', 'Centro da confermare', 'Center to be confirmed')}
          </Text>
        </View>
        {event.reminder_minutes ? (
          <View style={styles.reminderRow}>
            <Feather color={colors.primary} name="bell" size={11} />
            <Text style={[styles.reminderText, { color: colors.primary }]}>
                {tr('Recordatorio activado', 'Promemoria attivato', 'Reminder enabled')}
            </Text>
          </View>
        ) : null}
      </View>
      <Feather color={colors.mutedForeground} name="chevron-right" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
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
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 22,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  monthTitle: { fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekDay: { fontSize: 11, fontWeight: '700', textAlign: 'center', width: '14.2857%' },
  dayCell: { alignItems: 'center', height: 42, justifyContent: 'center', width: '14.2857%' },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
    width: 34,
  },
  dayText: { fontSize: 13, fontWeight: '600' },
  eventDot: {
    borderRadius: 2,
    bottom: 3,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  form: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
    padding: 16,
  },
  formTitle: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  input: { borderRadius: 11, borderWidth: 1, fontSize: 15, padding: 13 },
  dateSelector: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
  },
  dateSelectorButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    width: 42,
  },
  selectedDateCopy: { alignItems: 'center', flex: 1, gap: 3, paddingVertical: 10 },
  selectedDate: { fontSize: 14, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  selectedDateHint: { fontSize: 10, textAlign: 'center' },
  timeInputWrap: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 13,
  },
  timeInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  notesInput: { minHeight: 82, textAlignVertical: 'top' },
  saveButton: { alignItems: 'center', borderRadius: 11, padding: 14 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionCount: { fontSize: 12, marginTop: 2 },
  loader: { marginTop: 36 },
  list: { gap: 11 },
  appointmentCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 13,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  dateColumn: {
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  dayNumber: { fontSize: 22, fontWeight: '800', lineHeight: 24 },
  monthShort: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  appointmentInfo: { flex: 1, gap: 4 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  appointmentName: { flex: 1, fontSize: 15, fontWeight: '700' },
  statusDot: { borderRadius: 4, height: 8, width: 8 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  metaText: { flexShrink: 1, fontSize: 12 },
  separator: { fontSize: 13 },
  reminderRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 },
  reminderText: { fontSize: 11, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 34,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    marginBottom: 14,
    width: 60,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 7 },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
