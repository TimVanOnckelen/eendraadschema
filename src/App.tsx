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
    interactiveSVG, 
    simpleHierarchyView,
    currentView,
    setCurrentView
  } = useApp();
  const [reactInitialized, setReactInitialized] = useState(false);

  console.log('=== App Component Rendering ===');
  console.log('App rendering, currentView:', currentView);
  console.log('React version:', React.version);

  // Define menu items
  const menuItems: MenuItem[] = [
    { name: "Nieuw", view: "start" },
    { name: "Bestand", view: "file" },
    { name: "Eéndraadschema", view: "editor" },
    { name: "Situatieschema", view: "sitplan" },
    { name: "Print", view: "print" },
    { name: "Documentatie", view: "documentation" },
    { name: "Info/Contact", view: "contact" },
  ];

  useEffect(() => {
    // Setup global references (for backward compatibility with existing code)
    (globalThis as any).session = session;
    (globalThis as any).appDocStorage = appDocStorage;
    (globalThis as any).undostruct = undostruct;
    (globalThis as any).fileAPIobj = fileAPIobj;
    (window as any).interactiveSVG = interactiveSVG;
    (window as any).SimpleHierarchyView = SimpleHierarchyView;
    (window as any).simpleHierarchyView = simpleHierarchyView;

    // Initialize React-specific setup (file inputs, global functions)
    if (!reactInitialized) {
      try {
        initializeReactApp();
        setReactInitialized(true);
      } catch (error) {
        console.error("Failed to initialize React app:", error);
      }
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
  }, [session, appDocStorage, undostruct, fileAPIobj, interactiveSVG, simpleHierarchyView, setCurrentView, reactInitialized]);

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
      {/* Test button to verify React events work */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 999999999999, background: 'red', padding: '10px' }}>
        <button onClick={() => {
          console.log('TEST BUTTON CLICKED!');
          alert('Button works!');
        }}>Test Click</button>
      </div>
      
      <TopMenu items={menuItems} />
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
