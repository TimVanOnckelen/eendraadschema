import React, { useEffect, useRef, useState } from 'react';
import { useApp, AppView } from './AppContext';
import { SimpleHierarchyView } from './SimpleHierarchyView';
import { initializeReactApp } from './initialization';
import { StartScreen } from './components/StartScreen';
import { TopMenu, MenuItem } from './components/TopMenu';
import FilePage from './components/FilePage';
import EditorView from './components/EditorView';
import { SitPlanView } from './components/SitPlanView';
import { PrintView } from './components/PrintView';
import { DocumentationView } from './components/DocumentationView';
import { ContactView } from './components/ContactView';
import { dialogAlert } from './utils/DialogHelpers';
import { initTheme } from './utils/theme';
import { googleDriveService } from './storage/GoogleDriveService';
import {
  getSaveDestination,
  notifyDocumentStorageStateChanged,
  onDocumentStorageStateChange,
  onSaveDestinationChange,
  setSaveDestination,
  SaveDestination,
} from './storage/SaveDestination';
import {
  currentStorageFormat,
  downloadCopy,
  openFromLocalFile,
  saveToActiveBackend,
} from './storage/StorageActions';
import { EDStoStructure } from './importExport/importExport';
import {
  confirmDocumentReplacement,
  getDocumentState,
  markDocumentAutosaved,
  markDocumentDirty,
} from './storage/DocumentState';
import '../css/all.css';

// Initialize theme as early as possible to avoid a flash of the wrong theme
initTheme();

const App: React.FC = () => {
  const { 
    session, 
    appDocStorage, 
    undostruct, 
    fileAPIobj, 
    simpleHierarchyView,
    currentView,
    setCurrentView,
    structure
  } = useApp();
  const [reactInitialized, setReactInitialized] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{lastSavedStr: string | null, lastSavedInfo: any} | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [openDrivePickerOnMount, setOpenDrivePickerOnMount] = useState(false);
  const saveInProgress = useRef(false);
  const [saveDestination, setSaveDestinationState] = useState<SaveDestination>(
    getSaveDestination
  );

  // Sync the UI filename from the current structure without polling.
  useEffect(() => {
    const nextFilename = structure?.properties?.filename || '';
    setCurrentFilename((previousFilename) => (
      previousFilename === nextFilename ? previousFilename : nextFilename
    ));
  }, [structure]);

  useEffect(() => {
    const unsubscribeDestination = onSaveDestinationChange(
      setSaveDestinationState
    );
    const unsubscribeDocumentState = onDocumentStorageStateChange(() => {
      setCurrentFilename(globalThis.structure?.properties?.filename || '');
    });
    return () => {
      unsubscribeDestination();
      unsubscribeDocumentState();
    };
  }, []);

  useEffect(() => {
    globalThis.currentReactView = currentView;
  }, [currentView]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!getDocumentState().dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // File operations
  const clearDocumentBindings = () => {
    fileAPIobj.clear();
    googleDriveService.clearCurrentFile();
    notifyDocumentStorageStateChanged();
  };

  const handleNewFile = async () => {
    const confirmed = await confirmDocumentReplacement(
      'een nieuw schema starten'
    );
    if (confirmed) {
      clearDocumentBindings();
      globalThis.read_settings?.();
      setCurrentView('editor');
    }
  };

  const handleOpenFile = async () => {
    if (!(await confirmDocumentReplacement('een ander bestand openen'))) {
      return;
    }
    try {
      await openFromLocalFile();
      setCurrentView('editor');
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.error('Lokaal bestand openen is mislukt:', error);
        await dialogAlert(
          'Bestand openen mislukt',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  };

  const handleOpenFromDrive = () => {
    setOpenDrivePickerOnMount(true);
    setCurrentView('file');
  };

  const handleFileSettings = () => {
    setCurrentView('file');
  };

  const currentSaveFormat = (): 'eds' | 'json' => {
    return currentStorageFormat();
  };

  const saveWithDestination = async (
    saveAs: boolean,
    format: 'eds' | 'json' = currentSaveFormat()
  ) => {
    if (saveInProgress.current) return;
    saveInProgress.current = true;
    try {
      await saveToActiveBackend(format, saveAs);
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.error('Opslaan is mislukt:', error);
        await dialogAlert(
          'Opslaan mislukt',
          error instanceof Error ? error.message : String(error)
        );
      }
    } finally {
      saveInProgress.current = false;
    }
  };

  const handleSave = () => saveWithDestination(false);
  const handleSaveAs = () => saveWithDestination(true);

  const menuItems: MenuItem[] = [
    {
      name: "Bestand",
      icon: "📁",
      subMenu: [
        { name: "Nieuw", icon: "➕", action: handleNewFile },
        { name: "Openen vanaf computer...", icon: "💻", action: handleOpenFile },
        ...(googleDriveService.isConfigured() ? [{ name: "Openen vanuit Google Drive...", icon: "☁️", action: handleOpenFromDrive }] : []),
        { name: "Opslaglocatie en bestanden...", icon: "⚙️", action: handleFileSettings },
        { name: "─────────", icon: "", action: () => {} },
        { name: "Opslaan", icon: "💾", action: handleSave },
        { name: "Opslaan als...", icon: "📁", action: handleSaveAs },
        { name: "─────────", icon: "", action: () => {} },
        { name: "EDS-kopie downloaden", icon: "⬇️", action: () => downloadCopy('eds') },
        { name: "JSON-kopie downloaden", icon: "⬇️", action: () => downloadCopy('json') }
      ]
    },
    { name: "Eéndraadschema", icon: "⚡", view: "editor" },
    { name: "Situatieschema", icon: "🏠", view: "sitplan" },
    { name: "Print", icon: "🖨️", view: "print" },
    { name: "Documentatie", icon: "📖", view: "documentation" },
    { name: "Info/Contact", icon: "ℹ️", view: "contact" },
  ];

  useEffect(() => {
    // Setup global references (for backward compatibility with existing code)
    (globalThis as any).session = session;
    (globalThis as any).appDocStorage = appDocStorage;
    (globalThis as any).undostruct = undostruct;
    (globalThis as any).fileAPIobj = fileAPIobj;
    (window as any).SimpleHierarchyView = SimpleHierarchyView;
    (window as any).simpleHierarchyView = simpleHierarchyView;

    // Initialize React-specific setup (file inputs, global functions)
    if (!reactInitialized) {
      (async () => {
        try {
          const recoveryInfo = await initializeReactApp();
          setReactInitialized(true);
          
          // Check if there's a recovery available
          if (recoveryInfo.recoveryAvailable && recoveryInfo.lastSavedInfo) {
            setRecoveryData({
              lastSavedStr: recoveryInfo.lastSavedStr,
              lastSavedInfo: recoveryInfo.lastSavedInfo
            });
            setShowRecoveryDialog(true);
          }
        } catch (error) {
          console.error("Failed to initialize React app:", error);
        }
      })();
    }

    // Override the global switchToView function to use React state
    (globalThis as any).switchToView = (viewName: string) => {
      const viewMap: { [key: string]: AppView } = {
        'Nieuw': 'start',
        'Bestand': 'file',
        'Eéndraadschema': 'editor',
        'Situatieschema': 'sitplan',
        'Print': 'print',
        'Documentatie': 'documentation',
        'Info/Contact': 'contact'
      };
      const view = viewMap[viewName] || 'editor';
      setCurrentView(view);
    };

    console.log("React App initialized with all services");
  }, [session, appDocStorage, undostruct, fileAPIobj, simpleHierarchyView, setCurrentView, structure, reactInitialized]);

  useEffect(() => {
    const handleUndoRedo = (event: KeyboardEvent) => {
      if (currentView !== 'editor' && currentView !== 'sitplan') return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        globalThis.undoClicked?.();
      } else if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
        event.preventDefault();
        globalThis.redoClicked?.();
      }
    };
    document.addEventListener('keydown', handleUndoRedo);
    return () => document.removeEventListener('keydown', handleUndoRedo);
  }, [currentView]);

  const handleRecoverAutosave = async () => {
    if (recoveryData && recoveryData.lastSavedStr && structure) {
      try {
        clearDocumentBindings();
        EDStoStructure(recoveryData.lastSavedStr, true, false);
        markDocumentDirty();
        markDocumentAutosaved();
          
          // Close the dialog
          setShowRecoveryDialog(false);
          setRecoveryData(null);
          
          // Switch to editor view
          setCurrentView('editor');
          
        console.log('Autosave recovered successfully');
      } catch (error) {
        console.error('Error recovering autosave:', error);
        await dialogAlert('Fout bij autosave', 'Er is een fout opgetreden bij het herstellen van de autosave.');
      }
    }
  };

  const handleDiscardAutosave = async () => {
    try {
      await globalThis.autoSaver?.discardRecovery();
      setShowRecoveryDialog(false);
      setRecoveryData(null);
    } catch (error) {
      console.error('Autosave discard failed:', error);
      await dialogAlert(
        'Herstelkopie verwijderen mislukt',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const handleExampleSelect = (exampleNumber: number) => {
    clearDocumentBindings();
    markDocumentDirty();
    setCurrentView('editor');
  };

  const handleNewSchema = () => {
    clearDocumentBindings();
    setCurrentView('editor');
  };

  const handleLoadFile = () => void handleOpenFile();

  // Always render with menu
  return (
    <>
      <TopMenu items={menuItems} currentFilename={currentFilename} saveDestination={saveDestination} />
      
      {/* Recovery Dialog */}
      {showRecoveryDialog && recoveryData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: 'var(--text-primary)' }}>
              Automatisch opgeslagen bestand gevonden
            </h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Er is een automatisch opgeslagen versie gevonden van:
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
              <strong>Bestand:</strong> {recoveryData.lastSavedInfo?.filename || 'Onbekend'}<br/>
              <strong>Opgeslagen op:</strong> {recoveryData.lastSavedInfo?.currentTimeStamp || 'Onbekend'}
            </p>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Wilt u deze versie herstellen?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleDiscardAutosave}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Nee, niet herstellen
              </button>
              <button
                onClick={handleRecoverAutosave}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Ja, herstellen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {currentView === 'start' ? (
        <StartScreen 
          onExampleSelect={handleExampleSelect}
          onNewSchema={handleNewSchema}
          onLoadFile={handleLoadFile}
        />
      ) : currentView === 'file' ? (
        <FilePage
          openDrivePickerOnMount={openDrivePickerOnMount}
          onDrivePickerOpened={() => setOpenDrivePickerOnMount(false)}
        />
      ) : currentView === 'editor' ? (
        <EditorView />
      ) : currentView === 'sitplan' ? (
        <SitPlanView />
      ) : currentView === 'print' ? (
        <PrintView />
      ) : currentView === 'documentation' ? (
        <DocumentationView />
      ) : currentView === 'contact' ? (
        <ContactView />
      ) : null}
    </>
  );
};

export default App;
