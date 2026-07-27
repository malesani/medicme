import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureValues = new Map<string, string>();

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => secureValues.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => void secureValues.set(key, value)),
  deleteItemAsync: vi.fn(async (key: string) => void secureValues.delete(key)),
}));

import {
  acceptAIConsent,
  clearAIConsent,
  hasValidAIConsent,
  withdrawAIConsent,
} from './ai-consent-service';
import { AIPrivacyError, executePrivateAIRequest } from './execute-private-ai-request';
import {
  removeForbiddenFields,
  sanitizeMedicalValueForAI,
  validateSanitizedPayload,
} from './medical-data-sanitizer';

beforeEach(async () => {
  secureValues.clear();
  await clearAIConsent();
});

describe('consentimiento de IA', () => {
  it('bloquea consentimiento ausente, antiguo y retirado', async () => {
    expect(await hasValidAIConsent()).toBe(false);
    secureValues.set(
      'medpocket.ai-consent',
      JSON.stringify({ accepted: true, consentVersion: '0.9', acceptedAt: '', withdrawnAt: null })
    );
    expect(await hasValidAIConsent()).toBe(false);
    await acceptAIConsent();
    expect(await hasValidAIConsent()).toBe(true);
    await withdrawAIConsent();
    expect(await hasValidAIConsent()).toBe(false);
  });
});

describe('sanitización médica', () => {
  it('mantiene los campos clínicos y elimina identificadores anidados', () => {
    const sanitized = removeForbiddenFields({
      indicator: 'glucosa',
      value: 94,
      unit: 'mg/dL',
      profile: { name: 'Paciente', email: 'paciente@example.com', note: 'ayunas' },
    }) as Record<string, unknown>;
    expect(sanitized).toEqual({
      indicator: 'glucosa',
      value: 94,
      unit: 'mg/dL',
      profile: { note: 'ayunas' },
    });
    expect(validateSanitizedPayload(sanitized)).toBe(true);
  });

  it('crea el payload mínimo de un valor', () => {
    const value = sanitizeMedicalValueForAI({
      id: 'internal',
      exam_id: 'exam',
      metric_code: 'glucosa',
      value: 94,
      unit: 'mg/dL',
      captured_at: '2026-01-01',
      created_at: '2026-01-01',
      range_min: 70,
      range_max: 100,
    });
    expect(value).toEqual({
      indicator: 'glucosa',
      value: 94,
      unit: 'mg/dL',
      referenceRange: { min: 70, max: 100 },
    });
  });
});

describe('guard privado', () => {
  it('no ejecuta la solicitud sin consentimiento', async () => {
    const execute = vi.fn();
    await expect(
      executePrivateAIRequest({ payload: { value: 1 }, sanitize: (value) => value, execute })
    ).rejects.toMatchObject({ code: 'AI_CONSENT_REQUIRED' } satisfies Partial<AIPrivacyError>);
    expect(execute).not.toHaveBeenCalled();
  });

  it('ejecuta solo el payload sanitizado con consentimiento válido', async () => {
    await acceptAIConsent();
    const execute = vi.fn(async (payload) => payload);
    const result = await executePrivateAIRequest({
      payload: { indicator: 'glucosa', value: 94, name: 'Paciente' },
      sanitize: (payload) => removeForbiddenFields(payload),
      execute,
    });
    expect(result).toEqual({ indicator: 'glucosa', value: 94 });
    expect(execute).toHaveBeenCalledOnce();
  });
});
