/**
 * DocumentationView - React component for documentation page
 */

import React, { useEffect } from 'react';

export const DocumentationView: React.FC = () => {
  useEffect(() => {
    // Initialize the documentation page
    if (globalThis.showDocumentationPage) {
      globalThis.showDocumentationPage();
    }
  }, []);

  return (
    <div id="documentation-container" style={{ width: '100%', height: '100%' }}>
      {/* The legacy showDocumentationPage() will render into #configsection */}
      {/* This is a transitional component that wraps the legacy functionality */}
    </div>
  );
};
