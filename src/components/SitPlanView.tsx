/**
 * SitPlanView - React component for situation plan/schema view
 */

import React, { useEffect } from 'react';
import { useApp } from '../AppContext';

export const SitPlanView: React.FC = () => {
  const { structure } = useApp();

  useEffect(() => {
    // Initialize the situation plan view
    if (structure && globalThis.showSituationPlanPage) {
      globalThis.showSituationPlanPage();
    }
  }, [structure]);

  return (
    <div id="sitplan-container" style={{ width: '100%', height: '100%' }}>
      {/* The legacy showSituationPlanPage() will render into #outerdiv */}
      {/* This is a transitional component that wraps the legacy functionality */}
    </div>
  );
};
