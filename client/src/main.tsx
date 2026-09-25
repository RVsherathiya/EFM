import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n'; // Initialize react-i18next before rendering
import './constants/fonts'; // Initialize typography CSS tokens
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found in DOM');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
