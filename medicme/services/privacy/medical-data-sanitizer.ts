import type { Measurement } from '@/db';

const FORBIDDEN_FIELDS = new Set(
  [
    'name', 'firstName', 'lastName', 'fullName', 'email', 'phone', 'address',
    'taxCode', 'fiscalCode', 'socialSecurityNumber', 'patientId', 'medicalRecordNumber',
    'userId', 'deviceId', 'advertisingId', 'filePath', 'localUri', 'originalFileName',
    'doctorName', 'laboratoryName', 'latitude', 'longitude', 'gps', 'signature',
    'barcode', 'qrCode',
  ].map((field) => field.toLowerCase())
);

export type SanitizedMedicalValue = {
  indicator: string;
  value: number;
  unit: string;
  referenceRange: { min: number | null; max: number | null };
};

export function sanitizeMedicalValueForAI(measurement: Measurement): SanitizedMedicalValue {
  return {
    indicator: measurement.metric_code,
    value: measurement.value,
    unit: measurement.unit,
    referenceRange: { min: measurement.range_min, max: measurement.range_max },
  };
}

export function sanitizeMedicalValuesForAI(
  measurements: Measurement[]
): SanitizedMedicalValue[] {
  return measurements.map(sanitizeMedicalValueForAI);
}

export function sanitizeExtractedTextForAI(text: string): string {
  return text
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[correo eliminado]')
    .replace(/\b(?:\+?\d[\s().-]*){8,}\b/g, '[teléfono eliminado]')
    .trim();
}

export function sanitizeMedicalDocumentMetadata(metadata: unknown): unknown {
  return removeForbiddenFields(metadata);
}

export function removeForbiddenFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeForbiddenFields);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !FORBIDDEN_FIELDS.has(key.toLowerCase()))
      .map(([key, child]) => [key, removeForbiddenFields(child)])
  );
}

export function containsForbiddenFields(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenFields);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) =>
      FORBIDDEN_FIELDS.has(key.toLowerCase()) || containsForbiddenFields(child)
  );
}

export function validateSanitizedPayload(payload: unknown): boolean {
  if (payload === null || payload === undefined) return false;
  if (Array.isArray(payload)) return payload.length > 0 && payload.every(validateSanitizedPayload);
  if (typeof payload !== 'object') return true;

  const entries = Object.entries(payload as Record<string, unknown>);
  if (entries.length === 0) return false;
  return entries.every(
    ([key, value]) =>
      !FORBIDDEN_FIELDS.has(key.toLowerCase()) &&
      (value === null || validateSanitizedPayload(value))
  );
}
