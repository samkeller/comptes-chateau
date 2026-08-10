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
import { XpFeedbackProvider } from './context/XpFeedbackContext';
import { registerSW } from 'virtual:pwa-register';

addLocale('fr', frLocale);

const primeReactOptions: Partial<APIOptions> = {
  locale: 'fr',
}

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
    <PrimeReactProvider value={primeReactOptions}>
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
