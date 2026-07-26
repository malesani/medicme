import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';

export default function PdfsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">PDFs</ThemedText>
      <ThemedText style={styles.description}>
        Aquí aparecerán los documentos de tus exámenes médicos.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  description: {
    color: Palette.textSecondary,
    marginTop: 12,
  },
});
