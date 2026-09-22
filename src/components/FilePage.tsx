import React, { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import { GoogleDrivePanel } from "./GoogleDrivePanel";
import {
  getSaveDestination,
  notifyDocumentStorageStateChanged,
  onDocumentStorageStateChange,
  onSaveDestinationChange,
  SaveDestination,
  setSaveDestination,
  storageBackends,
} from "../storage/SaveDestination";
import {
  downloadCopy,
  openFromLocalFile,
  saveToBackend,
  StorageFormat,
} from "../storage/StorageActions";
import { dialogAlert, dialogPrompt } from "../utils/DialogHelpers";
import {
  confirmDocumentReplacement,
  markDocumentDirty,
} from "../storage/DocumentState";
import { appendStructureFromLocalFile } from "../importExport/importExport";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  marginBottom: "24px",
};

const primaryButton: React.CSSProperties = {
  background:
    "linear-gradient(135deg, var(--primary-color), var(--accent-color))",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "var(--surface)",
  color: "var(--primary-color)",
  border: "1px solid var(--primary-color)",
  padding: "10px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface FilePageProps {
  openDrivePickerOnMount?: boolean;
  onDrivePickerOpened?: () => void;
}

const FilePage: React.FC<FilePageProps> = ({
  openDrivePickerOnMount = false,
  onDrivePickerOpened,
}) => {
  const { structure, fileAPIobj, setCurrentView } = useApp();
  const [backend, setBackend] = useState<SaveDestination>(
    getSaveDestination
  );
  const [format, setFormat] = useState<StorageFormat>("eds");
  const [disableCompression, setDisableCompression] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, setDocumentStateVersion] = useState(0);

  useEffect(() => onSaveDestinationChange(setBackend), []);

  useEffect(
    () =>
      onDocumentStorageStateChange(() => {
        const filename = globalThis.structure?.properties?.filename || "";
        setFormat(filename.toLowerCase().endsWith(".json") ? "json" : "eds");
        setDocumentStateVersion((version) => version + 1);
      }),
    []
  );

  useEffect(() => {
    const filename = structure?.properties?.filename || "";
    setFormat(filename.toLowerCase().endsWith(".json") ? "json" : "eds");
    setDisableCompression(
      structure?.properties?.disableEDSCompression === true
    );
  }, [structure]);

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Bestandsbewerking is mislukt:", error);
        await dialogAlert("Bestandsbewerking mislukt", errorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  };

  const selectBackend = (nextBackend: SaveDestination) => {
    const definition = storageBackends.find(
      (candidate) => candidate.id === nextBackend
    );
    if (!definition?.available()) return;
    setSaveDestination(nextBackend);
  };

  const handleOpenLocal = () =>
    run(async () => {
      if (!(await confirmDocumentReplacement("een ander lokaal bestand openen"))) {
        return;
      }
      await openFromLocalFile();
      setCurrentView("editor");
    });

  const handleSaveLocal = (saveAs: boolean) =>
    run(async () => {
      await saveToBackend("local-file", format, saveAs);
    });

  const handleCompressionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    setDisableCompression(checked);
    if (structure?.properties) {
      structure.properties.disableEDSCompression = checked;
      markDocumentDirty();
    }
  };

  const handleRename = () =>
    run(async () => {
      const currentName =
        structure?.properties?.filename ||
        (format === "json" ? "eendraadschema.json" : "eendraadschema.eds");
      const nextName = await dialogPrompt(
        "Documentnaam wijzigen",
        "Geef een nieuwe documentnaam op.",
        currentName
      );
      if (nextName == null) return;
      const trimmedName = nextName.trim();
      if (!trimmedName) {
        throw new Error("De documentnaam mag niet leeg zijn.");
      }
      structure.properties.filename = trimmedName;
      markDocumentDirty();
      notifyDocumentStorageStateChanged();
    });

  return (
    <>
      <div className="modern-settings-container">
        <div className="modern-settings-header">
          <h1>Bestanden en opslag</h1>
          <p>
            Kies waar u verder werkt. Een kopie downloaden verandert de gekozen
            opslaglocatie niet.
          </p>
        </div>

        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
              Actieve opslaglocatie
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <strong>Opslaan</strong> werkt het bestand bij op de gekozen
              locatie. Opslaan via een andere kaart maakt of synchroniseert
              daar een gekoppelde kopie en maakt die locatie actief. Bestaande
              koppelingen blijven beschikbaar wanneer u terugschakelt; andere
              kopieën worden niet automatisch bijgewerkt.
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Tijdens het bewerken wordt automatisch een lokale herstelkopie
              in deze browser bijgehouden. Deze tijdelijke herstelkopie is geen
              opslaglocatie en vervangt opslaan op uw computer of Google Drive
              niet.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {storageBackends.map((option) => {
                const selected = backend === option.id;
                const available = option.available();
                return (
                  <button
                    type="button"
                    key={option.id}
                    disabled={!available}
                    aria-pressed={selected}
                    onClick={() => selectBackend(option.id)}
                    title={
                      available ? option.description : option.unavailableReason
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px",
                      borderRadius: "10px",
                      border: selected
                        ? "2px solid var(--primary-color)"
                        : "1px solid var(--border)",
                      background: selected
                        ? "color-mix(in srgb, var(--primary-color) 10%, var(--surface))"
                        : "var(--surface)",
                      cursor: available ? "pointer" : "not-allowed",
                      opacity: available ? 1 : 0.55,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{option.icon}</span>
                    <span>
                      <strong
                        style={{
                          display: "block",
                          color: "var(--text-primary)",
                        }}
                      >
                        {option.label}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {available
                          ? option.description
                          : option.unavailableReason}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        marginLeft: "auto",
                        color: selected
                          ? "var(--primary-color)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {selected ? "●" : "○"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
              Bestandsformaat
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <label style={{ color: "var(--text-primary)" }}>
                Formaat voor acties hieronder{" "}
                <select
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as StorageFormat)
                  }
                  style={{
                    marginLeft: "8px",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="eds">EDS (.eds)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  color: "var(--text-secondary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={disableCompression}
                  onChange={handleCompressionChange}
                  disabled={format === "json"}
                />
                EDS zonder compressie
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={handleRename}
                style={secondaryButton}
              >
                Documentnaam wijzigen…
              </button>
            </div>
          </section>

          <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
                Computer {backend === "local-file" ? "· actief" : ""}
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Open een bestaand bestand of bewaar het huidige schema als uw
                actieve lokale werkbestand.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleOpenLocal}
                  style={secondaryButton}
                >
                  Openen vanaf computer
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSaveLocal(false)}
                  style={primaryButton}
                >
                  {fileAPIobj.hasCurrentFile()
                    ? `Opslaan in ${fileAPIobj.filename}`
                    : "Opslaan op computer"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSaveLocal(true)}
                  style={secondaryButton}
                >
                  Opslaan als nieuw bestand…
                </button>
              </div>
          </section>

          <GoogleDrivePanel
            format={format}
            active={backend === "google-drive"}
            openPickerOnMount={openDrivePickerOnMount}
            onPickerOpened={onDrivePickerOpened}
          />

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
              Een lokale kopie downloaden
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Maakt een losse back-up of uitwisselbestand. Uw actieve
              opslaglocatie en gekoppelde werkbestand blijven ongewijzigd.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                onClick={() => downloadCopy("eds")}
                style={primaryButton}
              >
                EDS-kopie downloaden
              </button>
              <button
                type="button"
                onClick={() => downloadCopy("json")}
                style={secondaryButton}
              >
                JSON-kopie downloaden
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
              Schema samenvoegen
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Voeg een tweede lokaal EDS- of JSON-bestand toe aan het huidige
              schema. Sla uw werk vooraf op.
            </p>
            <button
              type="button"
              onClick={() => void appendStructureFromLocalFile()}
              style={secondaryButton}
            >
              Bestand samenvoegen…
            </button>
          </section>
        </div>
      </div>
    </>
  );
};

export default FilePage;
