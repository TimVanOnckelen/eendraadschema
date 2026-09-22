import { serializeCurrentStructure } from '../importExport/importExport';
import { dialogPrompt } from '../utils/DialogHelpers';
import { GoogleDriveFile, googleDriveService } from './GoogleDriveService';
import {
  notifyDocumentStorageStateChanged,
  setSaveDestination,
} from './SaveDestination';
import { markDocumentSaved } from './DocumentState';

function filenameWithExtension(
  filename: string,
  format: 'eds' | 'json'
): string {
  const trimmed = filename.trim();
  if (!trimmed) throw new Error('Bestandsnaam mag niet leeg zijn.');

  const extension = format === 'json' ? '.json' : '.eds';
  if (trimmed.toLowerCase().endsWith(extension)) return trimmed;
  return trimmed.replace(/\.(eds|json)$/i, '') + extension;
}

export function canOverwriteCurrentGoogleDriveFile(): boolean {
  return googleDriveService.getCurrentFile() !== null;
}

/** Saves current schema to Drive. Returns null when filename prompt is cancelled. */
export async function saveCurrentStructureToGoogleDrive(
  format: 'eds' | 'json',
  saveAs = false
): Promise<GoogleDriveFile | null> {
  if (!googleDriveService.isConfigured()) {
    throw new Error(
      'Google Drive is niet geconfigureerd. Stel VITE_GOOGLE_CLIENT_ID in.'
    );
  }

  const serialized = serializeCurrentStructure(format);
  const driveFile = googleDriveService.getCurrentFile();
  const expectedExtension = format === 'json' ? '.json' : '.eds';
  const createNewFile =
    saveAs ||
    !driveFile ||
    !driveFile.name.toLowerCase().endsWith(expectedExtension);
  let filename = serialized.filename;

  if (createNewFile) {
    const chosenName = await dialogPrompt(
      'Opslaan in Google Drive',
      'Geef een bestandsnaam op.',
      filename
    );
    if (chosenName == null) return null;
    filename = filenameWithExtension(chosenName, format);
  }

  const savedFile = await googleDriveService.saveFile(
    serialized.content,
    filename,
    serialized.mimeType,
    createNewFile
  );

  globalThis.structure.properties.filename = savedFile.name;
  globalThis.autoSaver?.saveManually(`TXT0040000${serialized.rawJson}`);
  markDocumentSaved();
  globalThis.propUpload?.(serialized.content);
  setSaveDestination('google-drive');
  notifyDocumentStorageStateChanged();
  return savedFile;
}
