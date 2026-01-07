/**
 * ContactView - React component for contact/info page
 */

import React, { useEffect } from 'react';

export const ContactView: React.FC = () => {
  useEffect(() => {
    // Initialize the contact page
    if (globalThis.openContactForm) {
      globalThis.openContactForm();
    }
  }, []);

  return (
    <div id="contact-container" style={{ width: '100%', height: '100%' }}>
      {/* The legacy openContactForm() will render into #configsection */}
      {/* This is a transitional component that wraps the legacy functionality */}
    </div>
  );
};
