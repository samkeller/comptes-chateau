import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { APIOptions, PrimeReactProvider, addLocale } from 'primereact/api';
import './assets/index.css'
import frLocale from './assets/primereact/Locale-FR.json';
import "./config/chartJsSetup";

import { RouterProvider } from 'react-router-dom';
import router from './routes/Router';
import './services/Interceptors';
import { GlobalToastProvider } from './context/GlobalToastContext';
import { ConnectedUserProvider } from './context/ConnectedUserContext';

addLocale('fr', frLocale);

const primeReactOptions: Partial<APIOptions> = {
  locale: 'fr',
}

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => {
        console.log('Service Worker registered successfully');
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <PrimeReactProvider value={primeReactOptions}>
      <GlobalToastProvider>
        <ConnectedUserProvider>
          <RouterProvider router={router} />
        </ConnectedUserProvider>
      </GlobalToastProvider>
    </PrimeReactProvider>
  </StrictMode>,
)
