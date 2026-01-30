import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { APIOptions, PrimeReactProvider, addLocale } from 'primereact/api';
import './assets/index.css'
import "primereact/resources/themes/md-light-indigo/theme.css";
import "../node_modules/primeflex/primeflex.css";
import 'primeicons/primeicons.css';
import frLocale from './assets/primereact/Locale-FR.json';

import { RouterProvider } from 'react-router-dom';
import router from './routes/Router';
import './services/Interceptors';

addLocale('fr', frLocale);

const primeReactOptions: Partial<APIOptions> = {
  locale: 'fr',
}

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <PrimeReactProvider value={primeReactOptions}>
      <RouterProvider router={router} />
    </PrimeReactProvider>
  </StrictMode>,
)
