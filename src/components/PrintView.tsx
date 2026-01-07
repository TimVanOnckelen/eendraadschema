/**
 * PrintView - React component for print view
 */

import React, { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

export const PrintView: React.FC = () => {
  const { structure } = useApp();
  const initialized = useRef(false);

  useEffect(() => {
    // Create configsection if it doesn't exist
    if (!document.getElementById('configsection')) {
      const configsection = document.createElement('div');
      configsection.id = 'configsection';
      configsection.className = 'configsection';
      document.body.appendChild(configsection);
    }

    // Initialize the print view only once
    if (structure && globalThis.printsvg && !initialized.current) {
      initialized.current = true;
      const configsection = document.getElementById('configsection');
      if (configsection) {
        configsection.style.display = 'block';
      }
      globalThis.printsvg();
    }

    // Cleanup: hide when unmounting
    return () => {
      const configsection = document.getElementById('configsection');
      if (configsection) {
        configsection.style.display = 'none';
      }
    };
  }, [structure]);

  return null; // The legacy code renders into #configsection directly
};
