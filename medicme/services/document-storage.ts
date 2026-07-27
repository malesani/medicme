import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type PendingDocument = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

export type StoredDocument = PendingDocument & {
  uri: string;
};

const STORAGE_FOLDER = 'medpocket-documents';

export function ensureDocumentStorage(): Directory | null {
  if (Platform.OS === 'web') return null;

  const directory = new Directory(Paths.document, STORAGE_FOLDER);
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function safeFileName(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'documento';
}

export function storeDocument(document: PendingDocument): StoredDocument {
  const directory = ensureDocumentStorage();
  if (!directory) {
    throw new Error('El almacenamiento de documentos de la app solo está disponible en Android e iOS.');
  }

  const source = new File(document.uri);
  const destination = new File(
    directory,
    `${randomUUID()}-${safeFileName(document.name)}`
  );
  source.copy(destination);

  return {
    ...document,
    uri: destination.uri,
    size: document.size ?? destination.size ?? undefined,
  };
}

export function deleteStoredDocument(uri: string): void {
  if (Platform.OS === 'web') return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

export async function openStoredDocument(
  uri: string,
  mimeType?: string
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('No hay ninguna aplicación disponible para abrir este archivo.');
  }
  await Sharing.shareAsync(uri, {
    dialogTitle: 'Abrir documento médico',
    mimeType,
  });
}
