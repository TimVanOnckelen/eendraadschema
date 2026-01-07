import React, { useEffect, useState } from 'react';
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
import '../css/all.css';

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

  // File operations
  const handleNewFile = () => {
    if (confirm('Weet u zeker dat u een nieuw schema wilt maken? Niet-opgeslagen wijzigingen gaan verloren.')) {
      setCurrentView('start');
    }
  };

  const handleOpenFile = async () => {
    // Use the global loadClicked function which handles both modern and legacy file APIs
    const loadClicked = (globalThis as any).loadClicked;
    if (loadClicked) {
      await loadClicked();
      // Switch to editor view after loading
      setCurrentView('editor');
    }
  };

  const handleSave = () => {
    const exportjson = (globalThis as any).exportjson;
    if (exportjson) {
      exportjson(false); // Save to current file
    }
  };

  const handleSaveAs = () => {
    const exportjson = (globalThis as any).exportjson;
    if (exportjson) {
      exportjson(true); // Save as new file
    }
  };

  // Define menu items with submenu
  const menuItems: MenuItem[] = [
    { 
      name: "Bestand", 
      icon: "📁",
      subMenu: [
        { name: "Nieuw", icon: "➕", action: handleNewFile },
        { name: "Openen...", icon: "📂", action: handleOpenFile },
        { name: "Opslaan", icon: "💾", action: handleSave },
        { name: "Opslaan als...", icon: "📥", action: handleSaveAs },
      ]
    },
    { name: "Eéndraadschema", icon: "⚡", view: "editor" },
    { name: "Situatieschema", icon: "🏠", view: "sitplan" },
    { name: "Print", icon: "🖨️", view: "print" },
    { name: "Documentatie", icon: "📚", view: "documentation" },
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

  const handleRecoverAutosave = () => {
    if (recoveryData && recoveryData.lastSavedStr && structure) {
      try {
        const EDStoStructure = (globalThis as any).EDStoStructure;
        if (EDStoStructure) {
          // Load the autosaved structure
          EDStoStructure(recoveryData.lastSavedStr, true, false);
          
          // Close the dialog
          setShowRecoveryDialog(false);
          setRecoveryData(null);
          
          // Switch to editor view
          setCurrentView('editor');
          
          console.log('Autosave recovered successfully');
        } else {
          console.error('EDStoStructure function not found');
        }
      } catch (error) {
        console.error('Error recovering autosave:', error);
        alert('Er is een fout opgetreden bij het herstellen van de autosave.');
      }
    }
  };

  const handleDiscardAutosave = () => {
    setShowRecoveryDialog(false);
    setRecoveryData(null);
  };

  const handleExampleSelect = (exampleNumber: number) => {
    setCurrentView('editor');
  };

  const handleNewSchema = () => {
    setCurrentView('start');
  };

  const handleLoadFile = () => {
    setCurrentView('editor');
  };

  // Always render with menu
  return (
    <>
      <TopMenu items={menuItems} />
      
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
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#333' }}>
              Automatisch opgeslagen bestand gevonden
            </h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
              Er is een automatisch opgeslagen versie gevonden van:
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              <strong>Bestand:</strong> {recoveryData.lastSavedInfo?.filename || 'Onbekend'}<br/>
              <strong>Opgeslagen op:</strong> {recoveryData.lastSavedInfo?.currentTimeStamp || 'Onbekend'}
            </p>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#666' }}>
              Wilt u deze versie herstellen?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleDiscardAutosave}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#495057',
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
                  backgroundColor: '#0d6efd',
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
        <FilePage />
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
