import { StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

export function MiniChart({ values, color }: { values: number[]; color: string }) {
  const colors = useColors();
  if (values.length < 2) return <View style={styles.container} />;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;

  return (
    <View style={styles.container}>
      {values.slice(-7).map((value, index, visible) => (
        <View
          key={`${value}-${index}`}
          style={[
            styles.bar,
            {
              backgroundColor: index === visible.length - 1 ? color : colors.border,
              height: Math.max(5, ((value - min) / range) * 28),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end', flexDirection: 'row', gap: 3, height: 28 },
  bar: { borderRadius: 2, width: 4 },
});
