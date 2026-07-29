import { Feather } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchBar } from '@/components/search-bar';
import { useLanguage } from '@/context/language-context';
import { useColors } from '@/hooks/use-colors';
import { listExams, type Exam } from '@/db';

type Filter = 'todos' | 'laboratorio' | 'cardiologia' | 'radiologia' | 'general';

function categoryFor(exam: Exam): Exclude<Filter, 'todos'> {
  const text = `${exam.type} ${exam.notes ?? ''}`.toLowerCase();
  if (/sangre|laboratorio|hemograma|bioqu/.test(text)) return 'laboratorio';
  if (/cardio|coraz|electro/.test(text)) return 'cardiologia';
  if (/radio|tac|resonancia|eco/.test(text)) return 'radiologia';
  return 'general';
}

export default function ExamsScreen() {
  const colors = useColors();
  const { language, tr } = useLanguage();
  const locale = { es: 'es-ES', it: 'it-IT', en: 'en-US' }[language];
  const insets = useSafeAreaInsets();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const filters: { key: Filter; label: string }[] = [
    { key: 'todos', label: tr('Todos', 'Tutti', 'All') },
    { key: 'laboratorio', label: tr('Laboratorio', 'Laboratorio', 'Laboratory') },
    { key: 'cardiologia', label: tr('Cardiología', 'Cardiologia', 'Cardiology') },
    { key: 'radiologia', label: tr('Radiología', 'Radiologia', 'Radiology') },
    { key: 'general', label: tr('General', 'Generale', 'General') },
  ];

  const load = useCallback(async () => {
    try {
      setExams(await listExams());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const visibleExams = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exams.filter((exam) => {
      const matchesSearch =
        !query || `${exam.type} ${exam.notes ?? ''}`.toLowerCase().includes(query);
      return matchesSearch && (filter === 'todos' || categoryFor(exam) === filter);
    });
  }, [exams, filter, search]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === 'web' ? 24 : insets.top + 16 },
          ]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{tr('Exámenes', 'Esami', 'Exams')}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {exams.length} {tr('documentos médicos', 'documenti medici', 'medical documents')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={tr('Añadir examen', 'Aggiungi esame', 'Add exam')}
            onPress={() => router.push('/examen/nuevo')}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <Feather color="#FFFFFF" name="plus" size={22} />
          </Pressable>
        </View>

        <View style={[styles.searchArea, { backgroundColor: colors.background }]}>
          <SearchBar
            onChangeText={setSearch}
            placeholder={tr('Buscar exámenes, centros, etiquetas…', 'Cerca esami, centri, etichette…', 'Search exams, centers, tags…')}
            value={search}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}>
            {filters.map((item) => {
              const active = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text style={{ color: active ? '#FFFFFF' : colors.mutedForeground, fontWeight: '600' }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : visibleExams.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather color={colors.mutedForeground} name="clipboard" size={28} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{tr('No hay resultados', 'Nessun risultato', 'No results')}</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {tr('Prueba con otra búsqueda o añade un examen.', 'Prova un’altra ricerca o aggiungi un esame.', 'Try another search or add an exam.')}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} locale={locale} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ExamCard({ exam, locale }: { exam: Exam; locale: string }) {
  const colors = useColors();
  const { tr } = useLanguage();
  const category = categoryFor(exam);
  const config = {
    laboratorio: {
      label: 'LABORATORIO',
      icon: 'droplet' as const,
      color: colors.laboratorio,
      background: colors.laboratorioLight,
    },
    cardiologia: {
      label: tr('CARDIOLOGÍA', 'CARDIOLOGIA', 'CARDIOLOGY'),
      icon: 'heart' as const,
      color: colors.cardiologia,
      background: colors.cardiologiaLight,
    },
    radiologia: {
      label: tr('RADIOLOGÍA', 'RADIOLOGIA', 'RADIOLOGY'),
      icon: 'aperture' as const,
      color: colors.radiologia,
      background: colors.radiologiaLight,
    },
    general: {
      label: 'GENERAL',
      icon: 'clipboard' as const,
      color: colors.mutedForeground,
      background: colors.muted,
    },
  }[category];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/examen/[id]', params: { id: exam.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: config.background }]}>
          <Feather color={config.color} name={config.icon} size={18} />
        </View>
        <View style={styles.categoryCopy}>
          <Text style={[styles.category, { color: config.color }]}>{config.label}</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {new Date(exam.date).toLocaleDateString(locale, { dateStyle: 'medium' })}
          </Text>
        </View>
        <Feather color={colors.mutedForeground} name="chevron-right" size={18} />
      </View>
      <Text numberOfLines={1} style={[styles.examName, { color: colors.text }]}>
        {exam.type}
      </Text>
      <View style={styles.meta}>
        <Feather color={colors.mutedForeground} name="map-pin" size={13} />
        <Text numberOfLines={1} style={[styles.metaText, { color: colors.mutedForeground }]}>
            {tr('Registro personal', 'Registro personale', 'Personal record')}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.fileInfo}>
          <Feather color={colors.mutedForeground} name="file-text" size={13} />
          <Text style={[styles.fileText, { color: colors.mutedForeground }]}>SQLite</Text>
        </View>
        {exam.notes ? (
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <Text numberOfLines={1} style={[styles.tagText, { color: colors.mutedForeground }]}>
              {exam.notes}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  searchArea: { gap: 17, paddingBottom: 22, paddingHorizontal: 20, paddingTop: 24 },
  filters: { gap: 10, paddingBottom: 2 },
  filter: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 10 },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  categoryCopy: { flex: 1 },
  category: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  date: { fontSize: 12, marginTop: 1 },
  examName: { fontSize: 17, fontWeight: '700', marginBottom: 7 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 13 },
  metaText: { flex: 1, fontSize: 13 },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fileInfo: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  fileText: { fontSize: 12 },
  tag: { borderRadius: 100, maxWidth: '62%', paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 11 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 60 },
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
  pressed: { opacity: 0.7 },
});
