/**
 * ContactView - React component for contact/info page
 */

import React, { useEffect, useRef } from 'react';

export const ContactView: React.FC = () => {
  const initialized = useRef(false);

  useEffect(() => {
    // Create configsection if it doesn't exist
    if (!document.getElementById('configsection')) {
      const configsection = document.createElement('div');
      configsection.id = 'configsection';
      configsection.className = 'configsection';
      document.body.appendChild(configsection);
    }

    // Initialize the contact page only once
    if (globalThis.openContactForm && !initialized.current) {
      initialized.current = true;
      const configsection = document.getElementById('configsection');
      if (configsection) {
        configsection.style.display = 'block';
      }
      globalThis.openContactForm();
    }

    // Cleanup: hide when unmounting
    return () => {
      const configsection = document.getElementById('configsection');
      if (configsection) {
        configsection.style.display = 'none';
      }
    };
  }, []);

  return null; // The legacy code renders into #configsection directly
};
