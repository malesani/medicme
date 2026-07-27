import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

import type { Measurement } from '@/db';

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
  measurements: Measurement[]
): Promise<HealthAgentAnalysis> {
  requireFirebaseConfig();

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: 'gemini-3.6-flash',
    systemInstruction: `
Eres Medi, un asistente educativo de bienestar. Analiza exclusivamente los resultados médicos
proporcionados. Explica en español sencillo qué significa cada indicador y ofrece hábitos generales
prudentes. Usa el rango entregado por el usuario; no inventes rangos. No diagnostiques enfermedades,
no prescribas medicamentos, no recomiendes suspender tratamientos y no presentes una posible causa
como certeza. Si un dato no puede interpretarse sin más contexto, dilo claramente. Recomienda
atención profesional cuando un valor esté fuera de rango o existan motivos de preocupación.
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

  const payload = measurements.map((measurement) => ({
    metricCode: measurement.metric_code,
    value: measurement.value,
    unit: measurement.unit,
    rangeMin: measurement.range_min,
    rangeMax: measurement.range_max,
    capturedAt: measurement.captured_at,
  }));

  const result = await model.generateContent(
    `Analiza estos resultados y responde usando el esquema solicitado:\n${JSON.stringify(payload)}`
  );
  const text = result.response.text();
  if (!text) throw new Error('Gemini devolvió una respuesta vacía.');

  return JSON.parse(text) as HealthAgentAnalysis;
}
