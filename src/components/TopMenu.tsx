import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppView } from '../AppContext';

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
}

export const TopMenu: React.FC<TopMenuProps> = ({ items }) => {
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

  const handleSubMenuClick = (action: () => void) => {
    action();
    setOpenSubmenu(null);
  };

  return (
    <div id="topmenu" ref={menuRef}>
      <ul id="minitabs">
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
                      onClick={() => handleSubMenuClick(subItem.action)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
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
    </div>
  );
};
