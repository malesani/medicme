import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { getExamById, type Exam } from '@/db';

export default function ExamDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (id) getExamById(id).then(setExam).catch(console.error);
  }, [id]);

  if (!exam) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.action}>
            <Feather color={colors.text} name="arrow-left" size={22} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.action}><Feather color={colors.text} name="share-2" size={20} /></Pressable>
            <Pressable style={styles.action}><Feather color={colors.text} name="edit-2" size={20} /></Pressable>
          </View>
        </View>
        <View style={[styles.heroIcon, { backgroundColor: colors.laboratorioLight }]}>
          <Feather color={colors.laboratorio} name="droplet" size={28} />
        </View>
        <Text style={[styles.category, { color: colors.laboratorio }]}>EXAMEN MÉDICO</Text>
        <Text style={[styles.title, { color: colors.text }]}>{exam.type}</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {new Date(exam.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Info icon="map-pin" label="Centro médico" value="Registro personal" />
          <Info icon="user" label="Especialidad" value="General" />
          <Info icon="file-text" label="Notas" value={exam.notes || 'Sin notas'} />
        </View>
      </ScrollView>
    </View>
  );

  function Info({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
    return (
      <View style={styles.info}>
        <Feather color={colors.primary} name={icon} size={18} />
        <View style={styles.infoCopy}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'web' ? 24 : 54,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  headerActions: { flexDirection: 'row', gap: 8 },
  action: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  heroIcon: { alignItems: 'center', borderRadius: 16, height: 58, justifyContent: 'center', marginBottom: 15, width: 58 },
  category: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 5 },
  date: { fontSize: 14, marginTop: 7 },
  card: { borderRadius: 16, borderWidth: 1, gap: 18, marginTop: 26, padding: 18 },
  info: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  infoCopy: { flex: 1, gap: 3 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 15, fontWeight: '600' },
});
