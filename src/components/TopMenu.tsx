import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppView } from '../AppContext';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { Icon } from './Icon';
import { IconName } from '../utils/icons';
import { getTheme, toggleTheme, Theme } from '../utils/theme';
import {
  getStorageBackend,
  SaveDestination,
} from '../storage/SaveDestination';

export interface SubMenuItem {
  name: string;
  action: () => void;
  icon?: IconName;
  divider?: boolean;
}

export interface MenuItem {
  name: string;
  view?: AppView;
  subMenu?: SubMenuItem[];
  icon?: IconName;
}

interface TopMenuProps {
  items: MenuItem[];
  currentFilename?: string;
  saveDestination?: SaveDestination;
}

export const TopMenu: React.FC<TopMenuProps> = ({ items, currentFilename, saveDestination }) => {
  const { currentView, setCurrentView } = useApp();
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(getTheme);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (item: MenuItem, index: number) => {
    if (item.subMenu) {
      setOpenSubmenu(openSubmenu === index ? null : index);
    } else if (item.view) {
      setCurrentView(item.view);
      setOpenSubmenu(null);
    }
  };

  const handleSubMenuClick = (action: () => void) => {
    action();
    setOpenSubmenu(null);
  };

  const handleThemeToggle = () => {
    setTheme(toggleTheme());
  };

  const destinationLabel = getStorageBackend(
    saveDestination ?? 'local-file'
  ).shortLabel;
  const editingView = currentView === 'editor' || currentView === 'sitplan';

  return (
    <div id="topmenu" ref={menuRef}>
      <div className="topmenu-left">
        <div className="topmenu-brand">
          <span className="topmenu-brand-mark"><Icon name="schema" size={15} strokeWidth={2} /></span>
          <span className="topmenu-brand-text">Eendraadschema</span>
        </div>
        <ul id="minitabs">
          {items.map((item, index) => (
            <li key={index} className="menu-item">
              <a
                id={currentView === item.view ? 'current' : undefined}
                onClick={() => handleMenuClick(item, index)}
                title={item.name}
              >
                {item.icon && <Icon name={item.icon} />}
                <span className="tab-label">{item.name}</span>
                {item.subMenu && <Icon name="chevron-down" size={14} style={{ marginLeft: '-2px', opacity: 0.7 }} />}
              </a>
              {item.subMenu && openSubmenu === index && (
                <ul className="submenu">
                  {item.subMenu.map((subItem, subIndex) =>
                    subItem.divider ? (
                      <li key={subIndex} className="submenu-divider" role="separator" />
                    ) : (
                      <li key={subIndex}>
                        <a onClick={() => handleSubMenuClick(subItem.action)}>
                          {subItem.icon && <Icon name={subItem.icon} />}
                          {subItem.name}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="topmenu-right">
        <button
          type="button"
          className="topmenu-icon-btn"
          title="Ongedaan maken (Ctrl/Cmd+Z)"
          aria-label="Ongedaan maken"
          disabled={!editingView}
          onClick={() => globalThis.undoClicked?.()}
        ><Icon name="undo" /></button>
        <button
          type="button"
          className="topmenu-icon-btn"
          title="Herhalen (Ctrl/Cmd+Y)"
          aria-label="Herhalen"
          disabled={!editingView}
          onClick={() => globalThis.redoClicked?.()}
        ><Icon name="redo" /></button>
        <span className="topmenu-divider" />
        <div className="topmenu-file" title={`Opslaan naar: ${destinationLabel}`}>
          <Icon name="file-text" size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="topmenu-file-name" aria-label="Bestandsnaam">{currentFilename || 'Zonder titel'}</span>
          <span className="topmenu-file-dest">· {destinationLabel}</span>
        </div>
        <AutoSaveIndicator
          autoSaver={globalThis.autoSaver}
          savedLocation={destinationLabel}
        />
        <button
          type="button"
          className="topmenu-icon-btn"
          onClick={handleThemeToggle}
          title={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
          aria-label={theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </div>
  );
};
