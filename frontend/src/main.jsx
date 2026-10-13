import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('[TaskBoard] Mounting React application...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root not found in document!');
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[TaskBoard] React application mounted successfully.');
} catch (err) {
  console.error('[TaskBoard] Fatal mount error:', err);
  document.body.innerHTML = `
    <div style="padding: 2rem; color: #f43f5e; font-family: monospace; background: #0a0d14; min-height: 100vh;">
      <h2>Fatal Application Mount Error</h2>
      <pre>${err.stack || err.message}</pre>
    </div>
  `;
}
