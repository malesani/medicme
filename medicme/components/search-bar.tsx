import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar…',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather color={colors.mutedForeground} name="search" size={18} />
      <TextInput
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
        value={value}
      />
      {value ? (
        <Pressable accessibilityLabel="Limpiar búsqueda" onPress={() => onChangeText('')}>
          <Feather color={colors.mutedForeground} name="x-circle" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, margin: 0, padding: 0 },
});
