import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Primereact V11
import { PrimeReactProvider } from '@primereact/core';
import LaraTheme from '@primeuix/themes/lara';
// v11
import { defineLocale} from '@primereact/core/locale';

import './assets/index.css'
import frLocale from './assets/primereact/Locale-FR.json';
import "./config/chartJsSetup";

import { RouterProvider } from 'react-router-dom';
import router from './routes/Router';
import './services/Interceptors';
import { GlobalToastProvider } from './context/GlobalToastContext';
import { ConnectedUserProvider } from './context/ConnectedUserContext';
import { XpFeedbackProvider } from './context/XpFeedbackContext';
import { registerSW } from 'virtual:pwa-register';

defineLocale('fr', frLocale);


registerSW({
  onNeedRefresh() {
    console.log('Nouvelle version disponible');
  },
  onOfflineReady() {
    console.log('Application disponible hors ligne');
  },
});

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <PrimeReactProvider theme={{preset: LaraTheme}} locale='fr'>
      <GlobalToastProvider>
        <ConnectedUserProvider>
          <XpFeedbackProvider>
            <RouterProvider router={router} />
          </XpFeedbackProvider>
        </ConnectedUserProvider>
      </GlobalToastProvider>
    </PrimeReactProvider>
  </StrictMode>,
)
