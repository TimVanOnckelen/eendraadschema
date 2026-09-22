export type StorageBackendId = 'local-file' | 'google-drive';
export type SaveDestination = StorageBackendId;

export interface StorageBackendDefinition {
  id: StorageBackendId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  available: () => boolean;
  unavailableReason?: string;
}

export const storageBackends: readonly StorageBackendDefinition[] = [
  {
    id: 'local-file',
    label: 'Computer',
    shortLabel: 'Computer',
    icon: '💻',
    description: 'Open en bewaar een werkbestand op deze computer.',
    available: () => true,
  },
  {
    id: 'google-drive',
    label: 'Google Drive',
    shortLabel: 'Drive',
    icon: '☁️',
    description: 'Open en bewaar een werkbestand in Google Drive.',
    available: () => Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()),
    unavailableReason: 'Google Drive is niet geconfigureerd voor deze installatie.',
  },
];

const CHANGE_EVENT = 'save-destination-change';
const DOCUMENT_STATE_EVENT = 'document-storage-state-change';
let activeDestination: SaveDestination = 'local-file';

export function getSaveDestination(): SaveDestination {
  const backend = getStorageBackend(activeDestination);
  return backend.available() ? activeDestination : 'local-file';
}

export function getStorageBackend(
  id: StorageBackendId
): StorageBackendDefinition {
  return (
    storageBackends.find((backend) => backend.id === id) ??
    storageBackends.find((backend) => backend.id === 'local-file')!
  );
}

export function setSaveDestination(destination: SaveDestination): void {
  const backend = getStorageBackend(destination);
  activeDestination = backend.available() ? destination : 'local-file';
  window.dispatchEvent(
    new CustomEvent<SaveDestination>(CHANGE_EVENT, {
      detail: activeDestination,
    })
  );
  notifyDocumentStorageStateChanged();
}

export function onSaveDestinationChange(
  listener: (destination: SaveDestination) => void
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<SaveDestination>).detail);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function notifyDocumentStorageStateChanged(): void {
  window.dispatchEvent(new Event(DOCUMENT_STATE_EVENT));
}

export function onDocumentStorageStateChange(
  listener: () => void
): () => void {
  window.addEventListener(DOCUMENT_STATE_EVENT, listener);
  return () => window.removeEventListener(DOCUMENT_STATE_EVENT, listener);
}
