import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppView } from '../AppContext';
import { AutoSaveIndicator } from './AutoSaveIndicator';

export interface SubMenuItem {
  name: string;
  action: () => void;
  icon?: string;
}

export interface MenuItem {
  name: string;
  view?: AppView;
  subMenu?: SubMenuItem[];
  icon?: string;
}

interface TopMenuProps {
  items: MenuItem[];
  currentFilename?: string;
}

export const TopMenu: React.FC<TopMenuProps> = ({ items, currentFilename }) => {
  const { currentView, setCurrentView } = useApp();
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
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

  const handleSubMenuClick = (action: () => void, name: string) => {
    // Don't do anything for dividers or headers
    if (name.includes('─────────') || name.includes('Recente bestanden:')) {
      return;
    }
    action();
    setOpenSubmenu(null);
  };

  return (
    <div id="topmenu" ref={menuRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
      <ul id="minitabs" style={{ margin: 0 }}>
        {items.map((item, index) => (
          <li key={index} className="menu-item">
            <a
              id={currentView === item.view ? 'current' : undefined}
              onClick={() => handleMenuClick(item, index)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.name}
              {item.subMenu && <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>}
            </a>
            {item.subMenu && openSubmenu === index && (
              <ul className="submenu">
                {item.subMenu.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <a
                      onClick={() => handleSubMenuClick(subItem.action, subItem.name)}
                      style={{ 
                        cursor: subItem.name.includes('─────────') || subItem.name.includes('Recente bestanden:') ? 'default' : 'pointer',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}
                    >
                      {subItem.icon && <span>{subItem.icon}</span>}
                      {subItem.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          padding: '4px 10px',
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#495057',
          fontWeight: 500,
          userSelect: 'none'
        }}>
          📄 {currentFilename || 'Zonder titel'}
        </div>
        <AutoSaveIndicator autoSaver={globalThis.autoSaver} />
      </div>
    </div>
  );
};
