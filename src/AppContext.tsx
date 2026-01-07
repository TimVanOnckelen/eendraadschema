import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Session } from './Session';
import { MultiLevelStorage } from './storage/MultiLevelStorage';
import { undoRedo } from './undoRedo';
import { importExportUsingFileAPI } from './importExport/importExport';
import { InteractiveSVG } from './InteractiveSVG';
import { SimpleHierarchyView } from './SimpleHierarchyView';
import { Hierarchical_List } from './Hierarchical_List';

interface AppContextType {
  session: Session;
  appDocStorage: MultiLevelStorage<any>;
  undostruct: undoRedo;
  fileAPIobj: importExportUsingFileAPI;
  interactiveSVG: InteractiveSVG;
  simpleHierarchyView: SimpleHierarchyView;
  structure: Hierarchical_List | null;
  setStructure: (structure: Hierarchical_List) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session] = useState(() => new Session());
  const [appDocStorage] = useState(() => new MultiLevelStorage<any>("appDocStorage", {}));
  const [undostruct] = useState(() => new undoRedo(100));
  const [fileAPIobj] = useState(() => new importExportUsingFileAPI());
  const [interactiveSVG] = useState(() => new InteractiveSVG());
  const [simpleHierarchyView] = useState(() => new SimpleHierarchyView());
  const [structure, setStructure] = useState<Hierarchical_List | null>(null);

  const value: AppContextType = {
    session,
    appDocStorage,
    undostruct,
    fileAPIobj,
    interactiveSVG,
    simpleHierarchyView,
    structure,
    setStructure,
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
