import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { SimpleHierarchyView } from './SimpleHierarchyView';
import { initializeApp } from './main';
import '../css/all.css';

const App: React.FC = () => {
  const { session, appDocStorage, undostruct, fileAPIobj, interactiveSVG, simpleHierarchyView } = useApp();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Setup global references (for backward compatibility with existing code)
    (globalThis as any).session = session;
    (globalThis as any).appDocStorage = appDocStorage;
    (globalThis as any).undostruct = undostruct;
    (globalThis as any).fileAPIobj = fileAPIobj;
    (window as any).interactiveSVG = interactiveSVG;
    (window as any).SimpleHierarchyView = SimpleHierarchyView;
    (window as any).simpleHierarchyView = simpleHierarchyView;

    console.log("React App initialized with all services");
    
    // Initialize the application after React has mounted and the container exists
    setTimeout(() => {
      try {
        initializeApp();
        setInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    }, 0);
  }, [session, appDocStorage, undostruct, fileAPIobj, interactiveSVG, simpleHierarchyView]);

  // Return the container that main.ts will populate
  // The main.ts file will fill this with the actual application UI
  return <div id="container" className="container"></div>;
};

export default App;
