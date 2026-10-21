/**
 * AutoSaveIndicator - Shows the current autosave status
 */

import React, { useEffect, useState } from 'react';
import { AutoSaver } from '../importExport/AutoSaver';
import {
  getDocumentState,
  onDocumentStateChange,
} from '../storage/DocumentState';

interface AutoSaveIndicatorProps {
  autoSaver?: AutoSaver;
  savedLocation?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  autoSaver,
  savedLocation,
}) => {
  const [lastSaveType, setLastSaveType] = useState<string>(AutoSaver.SavedType.NONE);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [documentState, setDocumentState] = useState(getDocumentState);
  const [, setTick] = useState(0);

  useEffect(() => onDocumentStateChange(setDocumentState), []);

  useEffect(() => {
    if (!autoSaver) return;

    // Set up callback after save
    const updateStatus = () => {
      const savedType = autoSaver.getSavedType();
      setLastSaveType(savedType);
      setLastSaveTime(new Date());
      setDocumentState(getDocumentState());
    };

    autoSaver.setCallbackAfterSave(updateStatus);

    // Initial status check
    updateStatus();

    const interval = setInterval(() => setTick((value) => value + 1), 1000);

    return () => {
      clearInterval(interval);
    };
  }, [autoSaver]);

  if (!autoSaver) return null;

  const getStatusColor = () => {
    if (
      lastSaveType === AutoSaver.SavedType.NONE &&
      !documentState.autosaveAvailable
    ) {
      return 'var(--text-muted)';
    } else if (documentState.dirty) {
      return 'var(--warning-color)';
    } else {
      return 'var(--success-color)';
    }
  };

  const getStatusText = () => {
    if (
      lastSaveType === AutoSaver.SavedType.NONE &&
      !documentState.autosaveAvailable
    ) {
      return 'Nog niet opgeslagen';
    } else if (documentState.dirty && documentState.autosaveAvailable) {
      return 'Niet opgeslagen · herstelkopie beschikbaar';
    } else if (documentState.dirty) {
      return 'Niet opgeslagen';
    } else {
      return savedLocation ? `Opgeslagen in ${savedLocation}` : 'Opgeslagen';
    }
  };

  const getTimeAgo = () => {
    if (!lastSaveTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaveTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
      return `${diffSecs}s geleden`;
    } else if (diffMins < 60) {
      return `${diffMins}m geleden`;
    } else {
      return `${diffHours}u geleden`;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '0 6px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}
      title={lastSaveTime ? `${getStatusText()} - ${getTimeAgo()}` : getStatusText()}
    >
      <span
        aria-hidden="true"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: getStatusColor(),
          flexShrink: 0
        }}
      />
      <span className="topmenu-status-text">{getStatusText()}</span>
      {lastSaveTime && (
        <span className="topmenu-status-text" style={{ color: 'var(--text-muted)' }}>
          · {getTimeAgo()}
        </span>
      )}
    </div>
  );
};
