import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/context/profile-context';
import { useColors } from '@/hooks/use-colors';

const bloodTypes = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

function Benefit({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  const colors = useColors();

  return (
    <View style={styles.benefit}>
      <View style={[styles.benefitIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather color={colors.primary} name={icon} size={19} />
      </View>
      <Text style={[styles.benefitText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function Field({
  label,
  icon,
  ...inputProps
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  inputMode?: 'text' | 'decimal';
}) {
  const colors = useColors();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: colors.border }]}>
        <Feather color={colors.mutedForeground} name={icon} size={17} />
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.text }]}
          {...inputProps}
        />
      </View>
    </View>
  );
}

function Choice({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        small && styles.choiceSmall,
        {
          backgroundColor: active ? colors.primaryLight : colors.background,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}>
      <Text
        style={[
          styles.choiceText,
          { color: active ? colors.primary : colors.mutedForeground },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [biologicalSex, setBiologicalSex] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodType, setBloodType] = useState<string | null>(null);

  const finish = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Faltan datos', 'Escribe tu nombre y apellido.');
      return;
    }
    const weightValue = weight.trim() ? Number(weight.replace(',', '.')) : null;
    const heightValue = height.trim() ? Number(height.replace(',', '.')) : null;
    if (
      (weightValue !== null && (!Number.isFinite(weightValue) || weightValue <= 0)) ||
      (heightValue !== null && (!Number.isFinite(heightValue) || heightValue <= 0))
    ) {
      Alert.alert('Revisa los datos', 'Peso y altura deben ser números positivos.');
      return;
    }

    try {
      setSaving(true);
      await saveProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate.trim() || null,
        biological_sex: biologicalSex,
        weight_kg: weightValue,
        height_cm: heightValue,
        blood_type: bloodType,
      });
      router.replace('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 1) {
    return (
      <View
        style={[
          styles.welcome,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 24,
            paddingTop: insets.top + 30,
          },
        ]}>
        <View style={styles.welcomeMain}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primaryLight }]}>
            <Image
              source={require('../assets/images/medpocket-icon.png')}
              style={styles.logo}
            />
          </View>
          <Text style={[styles.welcomeEyebrow, { color: colors.primary }]}>BIENVENIDO A</Text>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>MedPocket</Text>
          <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
            Tus exámenes, valores y citas médicas organizados en un único lugar privado.
          </Text>

          <View style={styles.benefits}>
            <Benefit icon="shield" text="Los datos permanecen en tu dispositivo" />
            <Benefit icon="activity" text="Sigue tus valores sin emitir diagnósticos" />
            <Benefit icon="calendar" text="Organiza exámenes y próximas citas" />
          </View>
        </View>

        <Pressable
          onPress={() => setStep(2)}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryButtonText}>Configurar mi perfil</Text>
          <Feather color="#FFFFFF" name="arrow-right" size={19} />
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 18 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => setStep(1)}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather color={colors.text} name="arrow-left" size={20} />
          </Pressable>
          <View style={styles.progress}>
            <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
            <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        <Text style={[styles.formTitle, { color: colors.text }]}>Cuéntanos sobre ti</Text>
        <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>
          Esto personaliza la aplicación. Podrás modificarlo después desde Perfil.
        </Text>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field
            icon="user"
            label="Nombre"
            onChangeText={setFirstName}
            placeholder="Tu nombre"
            value={firstName}
          />
          <Field
            icon="user"
            label="Apellido"
            onChangeText={setLastName}
            placeholder="Tu apellido"
            value={lastName}
          />
          <Field
            icon="calendar"
            label="Fecha de nacimiento (opcional)"
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            value={birthDate}
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Sexo de referencia del laboratorio (opcional)
          </Text>
          <View style={styles.choiceRow}>
            {['Femenino', 'Masculino', 'Otro'].map((option) => (
              <Choice
                active={biologicalSex === option}
                key={option}
                label={option}
                onPress={() => setBiologicalSex(option)}
              />
            ))}
          </View>

          <View style={styles.doubleRow}>
            <View style={styles.doubleField}>
              <Field
                icon="activity"
                inputMode="decimal"
                label="Peso (kg)"
                onChangeText={setWeight}
                placeholder="Ej. 72"
                value={weight}
              />
            </View>
            <View style={styles.doubleField}>
              <Field
                icon="arrow-up"
                inputMode="decimal"
                label="Altura (cm)"
                onChangeText={setHeight}
                placeholder="Ej. 175"
                value={height}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Grupo sanguíneo (opcional)
          </Text>
          <View style={styles.bloodGrid}>
            {bloodTypes.map((option) => (
              <Choice
                active={bloodType === option}
                key={option}
                label={option}
                onPress={() => setBloodType(option)}
                small
              />
            ))}
          </View>
        </View>

        <View style={[styles.privacyNote, { backgroundColor: colors.primaryLight }]}>
          <Feather color={colors.primary} name="lock" size={16} />
          <Text style={[styles.privacyText, { color: colors.primary }]}>
            Esta información se almacena únicamente en la base de datos local.
          </Text>
        </View>

        <Pressable
          disabled={saving}
          onPress={finish}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            saving && styles.disabled,
          ]}>
          <Text style={styles.primaryButtonText}>
            {saving ? 'Guardando…' : 'Entrar en MedPocket'}
          </Text>
          <Feather color="#FFFFFF" name="check" size={19} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );

}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  welcome: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  welcomeMain: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logoWrap: {
    alignItems: 'center',
    borderRadius: 34,
    height: 112,
    justifyContent: 'center',
    marginBottom: 28,
    width: 112,
  },
  logo: { borderRadius: 24, height: 84, width: 84 },
  welcomeEyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  welcomeTitle: { fontSize: 38, fontWeight: '900', marginTop: 6 },
  welcomeText: { fontSize: 16, lineHeight: 24, marginTop: 13, maxWidth: 380, textAlign: 'center' },
  benefits: { gap: 12, marginTop: 36, width: '100%' },
  benefit: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  benefitIcon: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  benefitText: { flex: 1, fontSize: 14, fontWeight: '600' },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  formContent: { paddingHorizontal: 20 },
  formHeader: { alignItems: 'center', flexDirection: 'row', gap: 18 },
  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  progressSegment: { borderRadius: 2, flex: 1, height: 4 },
  formTitle: { fontSize: 30, fontWeight: '900', marginTop: 28 },
  formSubtitle: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  formCard: { borderRadius: 18, borderWidth: 1, gap: 15, marginTop: 22, padding: 17 },
  field: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '700' },
  inputWrap: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  choiceRow: { flexDirection: 'row', gap: 7 },
  choice: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 7,
  },
  choiceSmall: { flexBasis: '21%', flexGrow: 1 },
  choiceText: { fontSize: 12, fontWeight: '700' },
  doubleRow: { flexDirection: 'row', gap: 10 },
  doubleField: { flex: 1, minWidth: 0 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  privacyNote: {
    alignItems: 'flex-start',
    borderRadius: 11,
    flexDirection: 'row',
    gap: 8,
    marginVertical: 18,
    padding: 12,
  },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
