import React from 'react';
import { createRoot } from 'react-dom/client';
import './initialization'; // Import initialization module to set up global functions
import App from './App';
import { AppProvider } from './AppContext';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);
