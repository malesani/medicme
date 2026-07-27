import { hasValidAIConsent } from './ai-consent-service';
import {
  containsForbiddenFields,
  removeForbiddenFields,
  validateSanitizedPayload,
} from './medical-data-sanitizer';

export type AIPrivacyErrorCode =
  | 'AI_CONSENT_REQUIRED'
  | 'AI_REQUEST_CANCELLED'
  | 'AI_INVALID_PAYLOAD'
  | 'AI_SENSITIVE_DATA_DETECTED'
  | 'AI_REQUEST_FAILED';

export class AIPrivacyError extends Error {
  constructor(public readonly code: AIPrivacyErrorCode) {
    super(code);
    this.name = 'AIPrivacyError';
  }
}

type PrivateAIRequestOptions<TPayload, TResult> = {
  payload: TPayload;
  sanitize: (payload: TPayload) => unknown;
  execute: (sanitizedPayload: unknown) => Promise<TResult>;
};

export async function executePrivateAIRequest<TPayload, TResult>(
  options: PrivateAIRequestOptions<TPayload, TResult>
): Promise<TResult> {
  if (!(await hasValidAIConsent())) throw new AIPrivacyError('AI_CONSENT_REQUIRED');

  const sanitized = options.sanitize(options.payload);
  if (containsForbiddenFields(sanitized)) {
    throw new AIPrivacyError('AI_SENSITIVE_DATA_DETECTED');
  }
  const recursivelySanitized = removeForbiddenFields(sanitized);
  if (!validateSanitizedPayload(recursivelySanitized)) {
    throw new AIPrivacyError('AI_INVALID_PAYLOAD');
  }

  try {
    return await options.execute(recursivelySanitized);
  } catch {
    throw new AIPrivacyError('AI_REQUEST_FAILED');
  }
}
