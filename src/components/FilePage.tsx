import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const FilePage: React.FC = () => {
  const { structure, fileAPIobj } = useApp();
  const [disableCompression, setDisableCompression] = useState(false);

  useEffect(() => {
    // Initialize checkbox state from structure properties
    if (
      structure &&
      structure.properties &&
      typeof structure.properties.disableEDSCompression !== 'undefined'
    ) {
      setDisableCompression(!!structure.properties.disableEDSCompression);
    }
  }, [structure]);

  const handleCompressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDisableCompression(checked);
    
    if (structure.properties) {
      structure.properties.disableEDSCompression = checked;
    }
  };

  const handleSave = async (saveAs: boolean) => {
    // Call the global exportjson function that's already implemented
    if (typeof globalThis.exportjson === 'function') {
      globalThis.exportjson(saveAs);
    }
  };

  const handleLoad = async () => {
    // Call the global loadClicked function
    if (typeof globalThis.loadClicked === 'function') {
      await globalThis.loadClicked();
    }
  };

  const handleMerge = async () => {
    // Call the global importToAppendClicked function
    if (typeof globalThis.importToAppendClicked === 'function') {
      await globalThis.importToAppendClicked();
    }
  };

  const handleNameChange = () => {
    // Call the global HL_enterSettings function for legacy mode
    if (typeof globalThis.HL_enterSettings === 'function') {
      globalThis.HL_enterSettings();
    }
  };

  const supportsFileAPI = !!(window as any).showOpenFilePicker;

  // Render save section based on file API support
  const renderSaveSection = () => {
    if (supportsFileAPI) {
      // Use fileAPI
      if (fileAPIobj.filename != null) {
        return (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => handleSave(false)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                💾 Opslaan
              </button>
              <button
                onClick={() => handleSave(true)}
                style={{
                  background: 'white',
                  color: 'var(--primary-color)',
                  border: '2px solid var(--primary-color)',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📁 Opslaan als
              </button>
            </div>
            <div
              style={{
                background: '#f0f9ff',
                borderLeft: '4px solid var(--secondary-color)',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>
                Laatst geopend of opgeslagen om <strong>{fileAPIobj.lastsaved}</strong> met naam{' '}
                <strong>{fileAPIobj.filename}</strong>
                <br />
                <br />
                Klik op "Opslaan" om bij te werken
              </div>
            </div>
          </>
        );
      } else {
        return (
          <>
            <button
              onClick={() => handleSave(true)}
              style={{
                background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '20px',
              }}
            >
              💾 Opslaan als
            </button>
            <div
              style={{
                background: '#fef3c7',
                borderLeft: '4px solid #f59e0b',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <strong style={{ color: '#92400e' }}>⚠️ Opgelet:</strong>
              <span style={{ color: '#92400e' }}>
                {' '}
                Uw werk werd nog niet opgeslagen tijdens deze sessie. Klik op "Opslaan als".
              </span>
            </div>
          </>
        );
      }
    } else {
      // Legacy mode
      return (
        <>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Bestandsnaam:{' '}
              <code
                style={{
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                {structure.properties?.filename || 'eendraadschema.eds'}
              </code>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSave(false)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                💾 Opslaan
              </button>
              <button
                onClick={handleNameChange}
                style={{
                  background: 'white',
                  color: 'var(--primary-color)',
                  border: '2px solid var(--primary-color)',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ✏️ Naam wijzigen
              </button>
            </div>
          </div>
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}
          >
            U kan het schema opslaan op uw lokale harde schijf voor later gebruik. De standaard-naam
            is eendraadschema.eds. U kan deze wijzigen door op "wijzigen" te klikken. Klik
            vervolgens op "opslaan" en volg de instructies van uw browser. In de meeste gevallen zal
            uw browser het bestand automatisch plaatsen in de Downloads-folder tenzij u uw browser
            instelde dat die eerst een locatie moet vragen.
            <br />
            <br />
            Eens opgeslagen kan het schema later opnieuw geladen worden door in het menu "openen" te
            kiezen en vervolgens het bestand op uw harde schijf te selecteren.
          </div>
        </>
      );
    }
  };

  return (
    <>
      <span id="exportscreen"></span>
      <div className="modern-settings-container">
        <div className="modern-settings-header">
          <h1>📂 Bestand</h1>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Openen Section */}
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
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              📥 Openen uit bestand
            </h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
              <button
                onClick={handleLoad}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                📂 Openen
              </button>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                Click op "openen" en selecteer een eerder opgeslagen EDS bestand.
              </p>
            </div>
          </div>

          {/* Opslaan Section */}
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
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              💾 Opslaan
            </h2>
            {renderSaveSection()}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={disableCompression}
                onChange={handleCompressionChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Opslaan zonder compressie (groter bestand)</span>
            </label>
          </div>

          {/* Samenvoegen Section */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h2
              style={{
                color: 'var(--primary-color)',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              🔀 Samenvoegen
            </h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
              <button
                onClick={handleMerge}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-color), var(--primary-color))',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                🔀 Samenvoegen
              </button>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: '0 0 12px 0',
                  }}
                >
                  Open een tweede EDS bestand en voeg de inhoud toe aan het huidige EDS bestand.
                  Voegt de ééndraadschema's samen en voegt eveneens pagina's toe aan het
                  situatieschema als dat nodig is.
                </p>
                <div
                  style={{
                    background: '#fef2f2',
                    borderLeft: '4px solid #dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                  }}
                >
                  <strong style={{ color: '#991b1b' }}>⚠️ Opgelet!</strong>
                  <span style={{ color: '#991b1b' }}>
                    {' '}
                    Het is aanbevolen uw werk op te slaan alvorens deze functie te gebruiken!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilePage;
