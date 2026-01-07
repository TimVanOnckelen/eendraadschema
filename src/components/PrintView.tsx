/**
 * PrintView - React component for print view
 */

import React, { useEffect } from 'react';
import { useApp } from '../AppContext';

export const PrintView: React.FC = () => {
  const { structure } = useApp();

  useEffect(() => {
    // Initialize the print view
    if (structure && globalThis.printsvg) {
      globalThis.printsvg();
    }
  }, [structure]);

  return (
    <div id="print-container" style={{ width: '100%', height: '100%' }}>
      {/* The legacy printsvg() will render into #configsection */}
      {/* This is a transitional component that wraps the legacy functionality */}
    </div>
  );
};
