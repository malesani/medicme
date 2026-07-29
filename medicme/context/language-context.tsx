import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getDb } from '@/db';
import { getSetting, setSetting } from '@/db/settings';
import { safeLogger } from '@/utils/safe-logger';

export type AppLanguage = 'en' | 'es' | 'it';
type Variables = Record<string, string | number>;

const translations = {
  es: {
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    italian: 'Italiano',
    back: 'Volver',
    welcomeTo: 'BIENVENIDO A',
    welcomeBody: 'Tus exámenes, valores y citas médicas organizados en un único lugar privado.',
    benefitPrivate: 'Los datos permanecen en tu dispositivo',
    benefitValues: 'Sigue tus valores sin emitir diagnósticos',
    benefitCalendar: 'Organiza exámenes y próximas citas',
    configureProfile: 'Configurar mi perfil',
    tellUs: 'Cuéntanos sobre ti',
    profileHint: 'Esto personaliza la aplicación. Podrás modificarlo después desde Perfil.',
    firstName: 'Nombre',
    firstNamePlaceholder: 'Tu nombre',
    lastName: 'Apellido',
    lastNamePlaceholder: 'Tu apellido',
    birthDate: 'Fecha de nacimiento (opcional)',
    biologicalSex: 'Sexo de referencia del laboratorio (opcional)',
    female: 'Femenino',
    male: 'Masculino',
    other: 'Otro',
    weight: 'Peso',
    weightKg: 'Peso (kg)',
    height: 'Altura',
    heightCm: 'Altura (cm)',
    bloodType: 'Grupo sanguíneo (opcional)',
    localOnly: 'Esta información se almacena únicamente en la base de datos local.',
    saving: 'Guardando…',
    enterApp: 'Entrar en MedPocket',
    missingData: 'Faltan datos',
    missingName: 'Escribe tu nombre y apellido.',
    checkData: 'Revisa los datos',
    invalidBodyValues: 'Peso y altura deben ser números positivos.',
    error: 'Error',
    profileSaveError: 'No se pudo guardar el perfil.',
    profile: 'Perfil',
    profilePrivacy: 'Tus datos médicos permanecen en el dispositivo',
    preferences: 'Preferencias',
    notifications: 'Notificaciones',
    appointmentReminders: 'Recordatorios de citas',
    darkMode: 'Modo oscuro',
    enabled: 'Activado',
    disabled: 'Desactivado',
    dataSecurity: 'Datos y seguridad',
    exportData: 'Exportar mis datos',
    pdfLocalCopy: 'PDF y copia local',
    backup: 'Copia de seguridad',
    thisDeviceOnly: 'Solo en este dispositivo',
    privacySecurity: 'Privacidad y seguridad',
    pinBiometrics: 'PIN y biometría',
    privacyPolicy: 'Política de privacidad',
    version: 'MedPocket · versión 1.0',
    home: 'Inicio',
    exams: 'Exámenes',
    analysis: 'Mi análisis',
    values: 'Valores',
    appointments: 'Citas',
  },
  it: {
    language: 'Lingua',
    english: 'Inglese',
    spanish: 'Spagnolo',
    italian: 'Italiano',
    back: 'Indietro',
    welcomeTo: 'BENVENUTO IN',
    welcomeBody: 'I tuoi esami, valori e appuntamenti medici organizzati in un unico luogo privato.',
    benefitPrivate: 'I dati rimangono sul tuo dispositivo',
    benefitValues: 'Monitora i valori senza formulare diagnosi',
    benefitCalendar: 'Organizza esami e prossimi appuntamenti',
    configureProfile: 'Configura il mio profilo',
    tellUs: 'Parlaci di te',
    profileHint: "Queste informazioni personalizzano l'app. Potrai modificarle in seguito dal Profilo.",
    firstName: 'Nome',
    firstNamePlaceholder: 'Il tuo nome',
    lastName: 'Cognome',
    lastNamePlaceholder: 'Il tuo cognome',
    birthDate: 'Data di nascita (opzionale)',
    biologicalSex: 'Sesso di riferimento del laboratorio (opzionale)',
    female: 'Femminile',
    male: 'Maschile',
    other: 'Altro',
    weight: 'Peso',
    weightKg: 'Peso (kg)',
    height: 'Altezza',
    heightCm: 'Altezza (cm)',
    bloodType: 'Gruppo sanguigno (opzionale)',
    localOnly: 'Queste informazioni sono archiviate esclusivamente nel database locale.',
    saving: 'Salvataggio…',
    enterApp: 'Entra in MedPocket',
    missingData: 'Dati mancanti',
    missingName: 'Inserisci nome e cognome.',
    checkData: 'Controlla i dati',
    invalidBodyValues: 'Peso e altezza devono essere numeri positivi.',
    error: 'Errore',
    profileSaveError: 'Impossibile salvare il profilo.',
    profile: 'Profilo',
    profilePrivacy: 'I tuoi dati medici rimangono sul dispositivo',
    preferences: 'Preferenze',
    notifications: 'Notifiche',
    appointmentReminders: 'Promemoria degli appuntamenti',
    darkMode: 'Modalità scura',
    enabled: 'Attivata',
    disabled: 'Disattivata',
    dataSecurity: 'Dati e sicurezza',
    exportData: 'Esporta i miei dati',
    pdfLocalCopy: 'PDF e copia locale',
    backup: 'Copia di sicurezza',
    thisDeviceOnly: 'Solo su questo dispositivo',
    privacySecurity: 'Privacy e sicurezza',
    pinBiometrics: 'PIN e biometria',
    privacyPolicy: 'Informativa sulla privacy',
    version: 'MedPocket · versione 1.0',
    home: 'Home',
    exams: 'Esami',
    analysis: 'La mia analisi',
    values: 'Valori',
    appointments: 'Appuntamenti',
  },
  en: {
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    italian: 'Italian',
    back: 'Back',
    welcomeTo: 'WELCOME TO',
    welcomeBody: 'Your medical exams, values, and appointments organized in one private place.',
    benefitPrivate: 'Your data stays on your device',
    benefitValues: 'Track your values without generating diagnoses',
    benefitCalendar: 'Organize exams and upcoming appointments',
    configureProfile: 'Set up my profile',
    tellUs: 'Tell us about yourself',
    profileHint: 'This personalizes the app. You can change it later from your Profile.',
    firstName: 'First name',
    firstNamePlaceholder: 'Your first name',
    lastName: 'Last name',
    lastNamePlaceholder: 'Your last name',
    birthDate: 'Date of birth (optional)',
    biologicalSex: 'Laboratory reference sex (optional)',
    female: 'Female',
    male: 'Male',
    other: 'Other',
    weight: 'Weight',
    weightKg: 'Weight (kg)',
    height: 'Height',
    heightCm: 'Height (cm)',
    bloodType: 'Blood type (optional)',
    localOnly: 'This information is stored only in the local database.',
    saving: 'Saving…',
    enterApp: 'Enter MedPocket',
    missingData: 'Missing information',
    missingName: 'Enter your first and last name.',
    checkData: 'Check your information',
    invalidBodyValues: 'Weight and height must be positive numbers.',
    error: 'Error',
    profileSaveError: 'The profile could not be saved.',
    profile: 'Profile',
    profilePrivacy: 'Your medical data stays on this device',
    preferences: 'Preferences',
    notifications: 'Notifications',
    appointmentReminders: 'Appointment reminders',
    darkMode: 'Dark mode',
    enabled: 'Enabled',
    disabled: 'Disabled',
    dataSecurity: 'Data and security',
    exportData: 'Export my data',
    pdfLocalCopy: 'PDF and local copy',
    backup: 'Backup',
    thisDeviceOnly: 'This device only',
    privacySecurity: 'Privacy and security',
    pinBiometrics: 'PIN and biometrics',
    privacyPolicy: 'Privacy policy',
    version: 'MedPocket · version 1.0',
    home: 'Home',
    exams: 'Exams',
    analysis: 'My analysis',
    values: 'Values',
    appointments: 'Appointments',
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

type LanguageContextValue = {
  language: AppLanguage;
  ready: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: TranslationKey, variables?: Variables) => string;
  tr: (spanish: string, italian: string, english: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await getDb();
        const saved = await getSetting('language');
        if (saved === 'en' || saved === 'es' || saved === 'it') setLanguageState(saved);
      } catch {
        safeLogger.error('Language initialization failed', { code: 'LANGUAGE_INIT_FAILED' });
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      await setSetting('language', nextLanguage);
    } catch (error) {
      setLanguageState(language);
      throw error;
    }
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, variables?: Variables) => {
      let result: string = translations[language][key];
      if (variables) {
        Object.entries(variables).forEach(([name, value]) => {
          result = result.replaceAll(`{{${name}}}`, String(value));
        });
      }
      return result;
    },
    [language]
  );

  const tr = useCallback(
    (spanish: string, italian: string, english: string) =>
      ({ es: spanish, it: italian, en: english })[language],
    [language]
  );

  const value = useMemo(
    () => ({ language, ready, setLanguage, t, tr }),
    [language, ready, setLanguage, t, tr]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
