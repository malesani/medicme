import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AIConsentRecord = {
  accepted: boolean;
  consentVersion: string;
  acceptedAt: string | null;
  withdrawnAt: string | null;
};

export const CURRENT_AI_CONSENT_VERSION = '1.0';
const CONSENT_KEY = 'medpocket.ai-consent';

async function readValue() {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CONSENT_KEY) ?? null;
  return SecureStore.getItemAsync(CONSENT_KEY);
}

async function writeValue(value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(CONSENT_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(CONSENT_KEY, value);
}

export async function getAIConsent(): Promise<AIConsentRecord | null> {
  try {
    const value = await readValue();
    return value ? (JSON.parse(value) as AIConsentRecord) : null;
  } catch {
    return null;
  }
}

export async function hasValidAIConsent(): Promise<boolean> {
  const record = await getAIConsent();
  return Boolean(
    record?.accepted &&
      record.withdrawnAt === null &&
      record.consentVersion === CURRENT_AI_CONSENT_VERSION
  );
}

export async function acceptAIConsent(): Promise<AIConsentRecord> {
  const record: AIConsentRecord = {
    accepted: true,
    consentVersion: CURRENT_AI_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    withdrawnAt: null,
  };
  await writeValue(JSON.stringify(record));
  return record;
}

export async function withdrawAIConsent(): Promise<AIConsentRecord> {
  const previous = await getAIConsent();
  const record: AIConsentRecord = {
    accepted: false,
    consentVersion: previous?.consentVersion ?? CURRENT_AI_CONSENT_VERSION,
    acceptedAt: previous?.acceptedAt ?? null,
    withdrawnAt: new Date().toISOString(),
  };
  await writeValue(JSON.stringify(record));
  return record;
}

export async function clearAIConsent(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(CONSENT_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(CONSENT_KEY);
}
