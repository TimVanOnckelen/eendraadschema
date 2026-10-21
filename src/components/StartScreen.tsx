import React from 'react';
import { EDStoStructure } from '../importExport/importExport';
import { useApp } from '../AppContext';
import { EXAMPLE0, EXAMPLE1 } from '../constants/examples';
import {
  confirmDocumentReplacement,
  markDocumentDirty,
} from '../storage/DocumentState';
import { read_settings } from '../initialization';
import { dialogAlert } from '../utils/DialogHelpers';
import { Icon } from './Icon';
import { IconName } from '../utils/icons';

interface StartScreenProps {
  onExampleSelect: (exampleNumber: number) => void;
  onNewSchema: () => void;
  onLoadFile: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onExampleSelect,
  onNewSchema,
  onLoadFile,
}) => {
  const { setStructure } = useApp();

  const handleLoadExample = async (nr: number) => {
    try {
      if (!(await confirmDocumentReplacement('dit voorbeeld openen'))) return;
      switch (nr) {
        case 0:
          EDStoStructure(EXAMPLE0);
          break;
        case 1:
          EDStoStructure(EXAMPLE1);
          break;
      }
      // Manually sync the structure to React state
      if ((globalThis as any).structure) {
        setStructure((globalThis as any).structure);
      }
      markDocumentDirty();
      onExampleSelect(nr);
    } catch (error) {
      console.error(`Failed to load example ${nr}:`, error);
      await dialogAlert(
        'Voorbeeld openen mislukt',
        `Voorbeeld ${nr + 1} kon niet worden geopend. Probeer een ander voorbeeld of maak een nieuw schema.`
      );
    }
  };

  const handleNewSchema = async () => {
    if (!(await confirmDocumentReplacement('een nieuw schema starten'))) return;
    // Call read_settings to create a new empty structure
    read_settings();
    // Manually sync the structure to React state
    if ((globalThis as any).structure) {
      setStructure((globalThis as any).structure);
    }
    onNewSchema();
  };

  const handleLoadFile = async () => {
    onLoadFile();
  };

  const actions: {
    title: string;
    description: string;
    cta: string;
    onClick: () => void;
    preview: string | IconName;
    badge?: string;
  }[] = [
    {
      title: 'Nieuw schema',
      description: 'Start met een leeg schema en bouw uw eigen elektrische installatie op.',
      cta: 'Nieuw schema starten',
      onClick: handleNewSchema,
      preview: 'file-plus',
    },
    {
      title: 'Bestand openen',
      description: 'Open een eerder opgeslagen EDS- of JSON-bestand van uw computer.',
      cta: 'Bestand kiezen',
      onClick: handleLoadFile,
      preview: 'folder-open',
    },
    {
      title: 'Voorbeeld 1',
      description: 'De basis: contactdozen en lichtpunten in een eenvoudige installatie.',
      cta: 'Voorbeeld openen',
      onClick: () => handleLoadExample(0),
      preview: 'examples/example000.svg',
      badge: 'Eenvoudig',
    },
    {
      title: 'Voorbeeld 2',
      description: 'Teleruptoren, verbruikers en gesplitste kringen.',
      cta: 'Voorbeeld openen',
      onClick: () => handleLoadExample(1),
      preview: 'examples/example001.svg',
      badge: 'Gevorderd',
    },
  ];

  return (
    <div className="page">
      <div className="page-inner">
        <header className="start-hero">
          <div>
            <p className="page-eyebrow">Eendraadschema</p>
            <h1 className="page-title">Teken uw elektrische installatie</h1>
            <p className="page-subtitle">
              Eéndraadschema's en situatieschema's volgens de Belgische normen — gratis en volledig in de browser.
            </p>
          </div>
          <div className="start-hero-meta">
            <span className="badge">PDF-export</span>
            <span className="badge">SVG-export</span>
            <span className="badge">Compatibel met eendraadschema.goethals-jacobs.be</span>
          </div>
        </header>

        <h2 className="section-title">Aan de slag</h2>
        <div className="grid grid-4">
          {actions.map((action) => (
            <button key={action.title} type="button" className="card start-action" onClick={action.onClick}>
              <div className="start-action-preview">
                {action.preview.includes('/') ? (
                  <img src={action.preview} alt="" />
                ) : (
                  <Icon name={action.preview as IconName} size={36} strokeWidth={1.25} />
                )}
              </div>
              <div className="start-action-body">
                <div className="start-action-title">
                  {action.title}
                  {action.badge && <span className="badge">{action.badge}</span>}
                </div>
                <p className="start-action-desc">{action.description}</p>
                <span className="start-action-cta">
                  {action.cta}
                  <Icon name="chevron-right" size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>

        <div id="autoSaveRecover"></div>

        <div className="grid grid-2 page-section">
          <section className="card">
            <div className="card-body">
              <h3 className="card-title"><Icon name="list" />Functies</h3>
              <ul className="check-list">
                {[
                  'Ééndraadschema\'s en situatieschema\'s',
                  'Domotica en geavanceerde installaties',
                  'PDF-export en printen',
                  'SVG-vectorformaat',
                  'Automatisch opslaan',
                  'Ongedaan maken en herhalen',
                ].map((feature) => (
                  <li key={feature}>
                    <Icon name="check" size={14} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div>
            <section className="card">
              <div className="card-body">
                <h3 className="card-title"><Icon name="lightbulb" />Tip</h3>
                <p>
                  Start met een voorbeeld. De voorbeelden tonen hoe het programma werkt en dat is veel sneller dan van nul beginnen.
                </p>
              </div>
            </section>
            <section className="card">
              <div className="card-body">
                <h3 className="card-title"><Icon name="info" />Over deze versie</h3>
                <p>
                  Deze versie is gebaseerd op het originele werk van <strong>Ivan Goethals</strong> en is verbeterd voor gebruiksgemak en prestaties.
                </p>
                <p className="meta-text">
                  <a href="https://eendraadschema.goethals-jacobs.be" target="_blank" rel="noreferrer">Originele versie</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
