import React, { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { EDStoStructure } from '../importExport/importExport';
import {
  GoogleDriveFile,
  googleDriveService,
} from '../storage/GoogleDriveService';
import { dialogAlert } from '../utils/DialogHelpers';
import {
  canOverwriteCurrentGoogleDriveFile,
  saveCurrentStructureToGoogleDrive,
} from '../storage/GoogleDriveActions';
import {
  notifyDocumentStorageStateChanged,
  onDocumentStorageStateChange,
  setSaveDestination,
} from '../storage/SaveDestination';
import { confirmDocumentReplacement } from '../storage/DocumentState';

interface GoogleDrivePanelProps {
  format: 'eds' | 'json';
  active?: boolean;
  openPickerOnMount?: boolean;
  onPickerOpened?: () => void;
}

function formatModifiedTime(value?: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('nl-BE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const GoogleDrivePanel: React.FC<GoogleDrivePanelProps> = ({
  format,
  active = false,
  openPickerOnMount = false,
  onPickerOpened,
}) => {
  const { fileAPIobj, setCurrentView } = useApp();
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [, setDocumentStateVersion] = useState(0);

  const configured = googleDriveService.isConfigured();
  const currentDriveFile = googleDriveService.getCurrentFile();
  const canOverwriteCurrentDriveFile = canOverwriteCurrentGoogleDriveFile();

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      console.error('Google Drive operation failed:', error);
      await dialogAlert('Google Drive', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const refreshFiles = async () => {
    const driveFiles = await googleDriveService.listFiles();
    setFiles(driveFiles);
  };

  const handleChooseFile = () =>
    run(async () => {
      await refreshFiles();
      setShowFilePicker(true);
    });

  useEffect(() => {
    if (!openPickerOnMount) {
      return;
    }
    onPickerOpened?.();
    if (!configured) return;
    handleChooseFile();
  }, [configured, openPickerOnMount]);

  useEffect(
    () =>
      onDocumentStorageStateChange(() => {
        setDocumentStateVersion((version) => version + 1);
      }),
    []
  );

  const handleOpen = (file: GoogleDriveFile) =>
    run(async () => {
      if (!(await confirmDocumentReplacement('een ander Drive-bestand openen'))) {
        return;
      }
      const content = await googleDriveService.downloadFile(file);
      EDStoStructure(content, true, false);
      googleDriveService.setCurrentFile(file);
      globalThis.structure.properties.filename = file.name;
      fileAPIobj.clear();
      setSaveDestination('google-drive');
      notifyDocumentStorageStateChanged();
      setShowFilePicker(false);
      setStatus(`${file.name} geopend vanuit Google Drive.`);
      setCurrentView('editor');
    });

  const handleSave = (saveAs: boolean) =>
    run(async () => {
      const savedFile = await saveCurrentStructureToGoogleDrive(format, saveAs);
      if (savedFile) {
        setStatus(`${savedFile.name} opgeslagen in Google Drive.`);
      }
    });

  const buttonStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: busy || !configured ? 'not-allowed' : 'pointer',
    opacity: busy || !configured ? 0.6 : 1,
  };

  return (
    <>
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            color: 'var(--primary-color)',
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Google Drive {active ? '· actief' : ''}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          Open en bewaar EDS- of JSON-bestanden in uw Google Drive. Toegang is beperkt
          tot bestanden die u met deze app opent of maakt.
        </p>

        {!configured && (
          <div
            style={{
              background: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              color: '#92400e',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px',
            }}
          >
            Google Drive is nog niet geconfigureerd. Beheerder: stel{' '}
            <code>VITE_GOOGLE_CLIENT_ID</code> in tijdens de build.
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            disabled={busy || !configured}
            onClick={handleChooseFile}
            style={{ ...buttonStyle, background: '#1a73e8', color: 'white' }}
          >
            {busy ? 'Bezig…' : 'Openen vanuit Drive'}
          </button>
          <button
            type="button"
            disabled={busy || !configured}
            onClick={() => handleSave(false)}
            style={{ ...buttonStyle, background: '#188038', color: 'white' }}
          >
            {canOverwriteCurrentDriveFile ? 'Opslaan in Drive' : 'Opslaan als in Drive'}
          </button>
          {currentDriveFile && (
            <button
              type="button"
              disabled={busy || !configured}
              onClick={() => handleSave(true)}
              style={{ ...buttonStyle, background: 'white', color: '#1a73e8', border: '1px solid #1a73e8' }}
            >
              Kopie opslaan in Drive
            </button>
          )}
        </div>

        {currentDriveFile && (
          <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Gekoppeld Drive-bestand: <strong>{currentDriveFile.name}</strong>
          </p>
        )}
        {status && (
          <p role="status" style={{ margin: '12px 0 0', color: '#137333', fontSize: '13px' }}>
            {status}
          </p>
        )}
      </div>

      {showFilePicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bestand openen vanuit Google Drive"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowFilePicker(false);
          }}
        >
          <div style={{ width: 'min(620px, 100%)', maxHeight: '80vh', overflow: 'auto', background: 'white', borderRadius: '10px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Google Drive-bestanden</h3>
              <button type="button" onClick={() => setShowFilePicker(false)} aria-label="Sluiten" style={{ border: 0, background: 'transparent', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            {files.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                Geen EDS- of JSON-bestanden gevonden die met deze app zijn gemaakt of geopend.
              </p>
            ) : (
              <div style={{ marginTop: '16px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                {files.map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    disabled={busy}
                    onClick={() => handleOpen(file)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '12px 14px', border: 0, borderBottom: '1px solid #eee', background: 'white', cursor: busy ? 'wait' : 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatModifiedTime(file.modifiedTime)}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" disabled={busy} onClick={() => run(refreshFiles)} className="rounded-button">Vernieuwen</button>
              <button type="button" onClick={() => setShowFilePicker(false)} className="rounded-button">Annuleren</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
