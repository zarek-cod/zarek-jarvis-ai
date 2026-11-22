// Must stay the first import: fills in crypto.randomUUID before any module uses it.
import './lib/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import { initApiBase } from './lib/api';
import './index.css';

function applyTheme() {
  try {
    const raw = localStorage.getItem('openjarvis-settings');
    const settings = raw ? JSON.parse(raw) : {};
    const theme = settings.theme || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  } catch { /* use system default */ }
}

applyTheme();

// Service workers are useful for the browser PWA, but inside a Tauri WebView
// they can keep serving an obsolete embedded frontend after an installer
// upgrade. The desktop build is already available offline, so remove any
// registration/cache left by an older version without touching user settings.
if ('__TAURI_INTERNALS__' in window && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => ('caches' in window ? caches.keys() : []))
    .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
    .catch(() => undefined);
}

// Fetch the API base URL from the Tauri backend before rendering.
// This ensures JARVIS_PORT is defined in one place (the Rust backend).
// In non-Tauri environments this is a no-op.
initApiBase().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  );
});
