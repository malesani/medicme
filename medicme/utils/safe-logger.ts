type SafeLogMetadata = { code: string };

const enabled = __DEV__;

export const safeLogger = {
  info(message: string) {
    if (enabled) console.info(`[MedPocket] ${message}`);
  },
  error(message: string, metadata: SafeLogMetadata) {
    if (enabled) console.error(`[MedPocket] ${message}`, metadata.code);
  },
};
