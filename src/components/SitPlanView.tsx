/**
 * SitPlanView - React component for situation plan/schema view
 */

import React, { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

export const SitPlanView: React.FC = () => {
  const { structure } = useApp();
  const initialized = useRef(false);

  useEffect(() => {
    // Create the required DOM structure if it doesn't exist
    if (!document.getElementById('outerdiv')) {
      const outerdiv = document.createElement('div');
      outerdiv.id = 'outerdiv';
      outerdiv.style.display = 'flex';
      
      const sidebar = document.createElement('div');
      sidebar.id = 'sidebar';
      outerdiv.appendChild(sidebar);
      
      const canvas = document.createElement('div');
      canvas.id = 'canvas';
      
      const paper = document.createElement('div');
      paper.id = 'paper';
      canvas.appendChild(paper);
      
      outerdiv.appendChild(canvas);
      
      document.body.appendChild(outerdiv);
    }

    // Initialize the situation plan view only once
    if (structure && globalThis.showSituationPlanPage && !initialized.current) {
      initialized.current = true;
      globalThis.showSituationPlanPage();
    }

    // Show the outerdiv when this component is mounted
    const outerdiv = document.getElementById('outerdiv');
    if (outerdiv) {
      outerdiv.style.display = 'flex';
    }

    // Cleanup: hide when unmounting
    return () => {
      const outerdiv = document.getElementById('outerdiv');
      if (outerdiv) {
        outerdiv.style.display = 'none';
      }
    };
  }, [structure]);

  return null; // The legacy code renders into #outerdiv directly
};
