import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useLanguage, type AppLanguage } from '@/context/language-context';
import { useColors } from '@/hooks/use-colors';

const options: AppLanguage[] = ['en', 'es', 'it'];

function Flag({ language }: { language: AppLanguage }) {
  if (language === 'en') {
    return (
      <View style={[styles.flag, styles.ukFlag]}>
        <View style={styles.ukWhiteHorizontal} />
        <View style={styles.ukWhiteVertical} />
        <View style={styles.ukRedHorizontal} />
        <View style={styles.ukRedVertical} />
      </View>
    );
  }

  if (language === 'es') {
    return (
      <View style={styles.flag}>
        <View style={[styles.horizontalStripe, styles.spainRed]} />
        <View style={[styles.horizontalStripe, styles.spainYellow]} />
        <View style={[styles.horizontalStripe, styles.spainRed]} />
      </View>
    );
  }

  return (
    <View style={[styles.flag, styles.italyFlag]}>
      <View style={[styles.verticalStripe, styles.italyGreen]} />
      <View style={[styles.verticalStripe, styles.italyWhite]} />
      <View style={[styles.verticalStripe, styles.italyRed]} />
    </View>
  );
}

export function LanguageSelector({
  compact = false,
  style,
}: {
  compact?: boolean;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const { language, setLanguage, t } = useLanguage();

  return (
    <View
      accessibilityLabel={t('language')}
      accessibilityRole="radiogroup"
      style={[styles.container, { backgroundColor: colors.muted }, style]}>
      {options.map((code) => {
        const active = language === code;
        const label =
          code === 'en' ? t('english') : code === 'es' ? t('spanish') : t('italian');

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            key={code}
            onPress={() => void setLanguage(code)}
            style={[
              styles.option,
              compact && styles.compactOption,
              {
                backgroundColor: active ? colors.card : 'transparent',
                borderColor: active ? colors.primary : 'transparent',
              },
            ]}>
            <Flag language={code} />
            {!compact ? (
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}>
                {label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    flexDirection: 'row',
    gap: 3,
    padding: 4,
  },
  option: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  compactOption: { minHeight: 38, paddingHorizontal: 10 },
  flag: {
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 3,
    borderWidth: 1,
    height: 18,
    overflow: 'hidden',
    width: 27,
  },
  horizontalStripe: { flex: 1 },
  spainRed: { backgroundColor: '#AA151B' },
  spainYellow: { backgroundColor: '#F1BF00', flex: 2 },
  ukFlag: { backgroundColor: '#21468B', position: 'relative' },
  ukWhiteHorizontal: {
    backgroundColor: '#FFFFFF',
    height: 7,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 5,
  },
  ukWhiteVertical: {
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 10,
    position: 'absolute',
    top: 0,
    width: 7,
  },
  ukRedHorizontal: {
    backgroundColor: '#CF142B',
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 7,
  },
  ukRedVertical: {
    backgroundColor: '#CF142B',
    bottom: 0,
    left: 12,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  italyFlag: { flexDirection: 'row' },
  verticalStripe: { flex: 1 },
  italyGreen: { backgroundColor: '#009246' },
  italyWhite: { backgroundColor: '#FFFFFF' },
  italyRed: { backgroundColor: '#CE2B37' },
  label: { fontSize: 13, fontWeight: '800' },
});
