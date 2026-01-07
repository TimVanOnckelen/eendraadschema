/**
 * AutoSaveIndicator - Shows the current autosave status
 */

import React, { useEffect, useState } from 'react';
import { AutoSaver } from '../importExport/AutoSaver';

interface AutoSaveIndicatorProps {
  autoSaver?: AutoSaver;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ autoSaver }) => {
  const [lastSaveType, setLastSaveType] = useState<string>(AutoSaver.SavedType.NONE);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!autoSaver) return;

    // Set up callback after save
    const updateStatus = () => {
      const savedType = autoSaver.getSavedType();
      setLastSaveType(savedType);
      setLastSaveTime(new Date());
      setHasUnsavedChanges(autoSaver.hasChangesSinceLastManualSave());
    };

    autoSaver.setCallbackAfterSave(updateStatus);

    // Initial status check
    updateStatus();

    // Check every second for changes
    const interval = setInterval(() => {
      setHasUnsavedChanges(autoSaver.hasChangesSinceLastManualSave());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [autoSaver]);

  if (!autoSaver) return null;

  const getStatusIcon = () => {
    if (lastSaveType === AutoSaver.SavedType.NONE) {
      return '○'; // No save yet
    } else if (hasUnsavedChanges) {
      return '◐'; // Unsaved changes (automatic save)
    } else {
      return '●'; // Saved (manual save)
    }
  };

  const getStatusColor = () => {
    if (lastSaveType === AutoSaver.SavedType.NONE) {
      return '#6c757d'; // Gray
    } else if (hasUnsavedChanges) {
      return '#ffc107'; // Yellow/warning
    } else {
      return '#28a745'; // Green
    }
  };

  const getStatusText = () => {
    if (lastSaveType === AutoSaver.SavedType.NONE) {
      return 'Nog niet opgeslagen';
    } else if (hasUnsavedChanges) {
      return 'Automatisch opgeslagen';
    } else {
      return 'Opgeslagen';
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
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#495057',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}
      title={lastSaveTime ? `${getStatusText()} - ${getTimeAgo()}` : getStatusText()}
    >
      <span style={{ fontSize: '14px', color: getStatusColor() }}>
        {getStatusIcon()}
      </span>
      <span>{getStatusText()}</span>
      {lastSaveTime && (
        <span style={{ fontSize: '11px', color: '#6c757d' }}>
          ({getTimeAgo()})
        </span>
      )}
    </div>
  );
};
