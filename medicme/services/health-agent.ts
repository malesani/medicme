import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

import type { Measurement } from '@/db';
import { executePrivateAIRequest } from '@/services/privacy/execute-private-ai-request';
import {
  sanitizeMedicalValuesForAI,
  type SanitizedMedicalValue,
} from '@/services/privacy/medical-data-sanitizer';
import { safeLogger } from '@/utils/safe-logger';

export type AgentFinding = {
  metricCode: string;
  status: 'high' | 'low' | 'normal' | 'unknown';
  explanation: string;
  meaning: string;
  suggestions: string[];
  professionalAdvice: string;
};

export type HealthAgentAnalysis = {
  summary: string;
  findings: AgentFinding[];
  generalSuggestions: string[];
  disclaimer: string;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function requireFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Firebase no está configurado. Faltan: ${missing.join(', ')}`);
  }
}

export async function analyzeHealthMeasurements(
  measurements: Measurement[],
  language: 'en' | 'es' | 'it' = 'es'
): Promise<HealthAgentAnalysis> {
  return executePrivateAIRequest({
    payload: measurements,
    sanitize: sanitizeMedicalValuesForAI,
    execute: (payload) => executeSanitizedAnalysis(payload, language),
  });
}

async function executeSanitizedAnalysis(
  payload: unknown,
  language: 'en' | 'es' | 'it'
): Promise<HealthAgentAnalysis> {
  requireFirebaseConfig();
  const values = payload as SanitizedMedicalValue[];

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const responseLanguage = { es: 'español', it: 'italiano', en: 'inglés' }[language];
  const model = getGenerativeModel(ai, {
    model: 'gemini-3.6-flash',
    systemInstruction: `
Eres Medi, un asistente educativo de bienestar. Analiza exclusivamente los resultados médicos
proporcionados. Responde siempre en ${responseLanguage}. Explica de forma sencilla qué significa cada indicador y ofrece hábitos generales
prudentes. Usa el rango entregado por el usuario; no inventes rangos. No diagnostiques enfermedades,
no prescribas medicamentos, no recomiendes suspender tratamientos y no presentes una posible causa
como certeza. Si un dato no puede interpretarse sin más contexto, dilo claramente. Recomienda
atención profesional cuando un valor esté fuera de rango o existan motivos de preocupación.
Usa exactamente el valor "indicator" recibido como "metricCode" en cada hallazgo.
`,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      responseJsonSchema: {
        type: 'object',
        required: ['summary', 'findings', 'generalSuggestions', 'disclaimer'],
        properties: {
          summary: { type: 'string' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'metricCode',
                'status',
                'explanation',
                'meaning',
                'suggestions',
                'professionalAdvice',
              ],
              properties: {
                metricCode: { type: 'string' },
                status: { type: 'string', enum: ['high', 'low', 'normal', 'unknown'] },
                explanation: { type: 'string' },
                meaning: { type: 'string' },
                suggestions: { type: 'array', items: { type: 'string' } },
                professionalAdvice: { type: 'string' },
              },
            },
          },
          generalSuggestions: { type: 'array', items: { type: 'string' } },
          disclaimer: { type: 'string' },
        },
      },
    },
  });

  safeLogger.info('AI request started');
  const result = await model.generateContent(
    `Analiza estos resultados y responde usando el esquema solicitado:\n${JSON.stringify(values)}`
  );
  const text = result.response.text();
  if (!text) throw new Error('EMPTY_AI_RESPONSE');
  safeLogger.info('AI request completed');
  return JSON.parse(text) as HealthAgentAnalysis;
}
