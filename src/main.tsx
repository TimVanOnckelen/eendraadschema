import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './AppContext';

console.log('=== main.tsx executing ===');
console.log('React:', React);
console.log('createRoot:', createRoot);

const container = document.getElementById('root');
console.log('Root container:', container);

if (!container) {
  throw new Error('Root element not found');
}

console.log('Creating React root...');
const root = createRoot(container);
console.log('Rendering app...');
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);
console.log('=== React app rendered ===');
