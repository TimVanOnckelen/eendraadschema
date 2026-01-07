import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './AppContext';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
