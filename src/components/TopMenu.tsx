import React from 'react';
import { useApp, AppView } from '../AppContext';

export interface MenuItem {
  name: string;
  view: AppView;
}

interface TopMenuProps {
  items: MenuItem[];
}

export const TopMenu: React.FC<TopMenuProps> = ({ items }) => {
  const { currentView, setCurrentView } = useApp();

  const handleMenuClick = (item: MenuItem) => {
    console.log('TopMenu clicked:', item.name, 'view:', item.view);
    console.log('Current view before:', currentView);
    setCurrentView(item.view);
    console.log('setCurrentView called with:', item.view);
  };

  return (
    <div id="topmenu">
      <ul id="minitabs">
        {items.map((item, index) => (
          <li key={index} className="menu-item">
            <a
              id={currentView === item.view ? 'current' : undefined}
              onClick={() => handleMenuClick(item)}
              style={{ cursor: 'pointer' }}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
