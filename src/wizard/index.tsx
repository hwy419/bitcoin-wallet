import React from 'react';
import { createRoot } from 'react-dom/client';
import WizardApp from './WizardApp';
import '../tab/styles/index.css'; // Reuse existing Tailwind styles

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <WizardApp />
  </React.StrictMode>
);
