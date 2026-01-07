import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Session } from './Session';
import { MultiLevelStorage } from './storage/MultiLevelStorage';
import { undoRedo } from './undoRedo';
import { importExportUsingFileAPI } from './importExport/importExport';
import { SimpleHierarchyView } from './SimpleHierarchyView';
import { Hierarchical_List } from './Hierarchical_List';

export type AppView = 'start' | 'file' | 'editor' | 'sitplan' | 'print' | 'documentation' | 'contact';

interface AppContextType {
  session: Session;
  appDocStorage: MultiLevelStorage<any>;
  undostruct: undoRedo;
  fileAPIobj: importExportUsingFileAPI;
  simpleHierarchyView: SimpleHierarchyView;
  structure: Hierarchical_List | null;
  setStructure: (structure: Hierarchical_List) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session] = useState(() => new Session());
  const [appDocStorage] = useState(() => new MultiLevelStorage<any>("appDocStorage", {}));
  const [undostruct] = useState(() => new undoRedo(100));
  const [fileAPIobj] = useState(() => new importExportUsingFileAPI());
  const [simpleHierarchyView] = useState(() => new SimpleHierarchyView());
  const [structure, setStructure] = useState<Hierarchical_List | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('start');

  // Expose simpleHierarchyView to global for legacy code
  React.useEffect(() => {
    (window as any).simpleHierarchyView = simpleHierarchyView;
  }, [simpleHierarchyView]);

  // Sync structure with globalThis.structure
  React.useEffect(() => {
    // Set initial globalThis.structure if it exists
    if ((globalThis as any).structure && !structure) {
      setStructure((globalThis as any).structure);
    }
    
    // Set up a polling mechanism to detect changes to globalThis.structure
    const interval = setInterval(() => {
      if ((globalThis as any).structure !== structure) {
        setStructure((globalThis as any).structure);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [structure]);

  // Also sync structure to globalThis when it changes in React
  React.useEffect(() => {
    if (structure) {
      (globalThis as any).structure = structure;
    }
  }, [structure]);

  const value: AppContextType = {
    session,
    appDocStorage,
    undostruct,
    fileAPIobj,
    simpleHierarchyView,
    structure,
    setStructure,
    currentView,
    setCurrentView,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
