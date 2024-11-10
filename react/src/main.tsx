import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api';
import './assets/index.css'
import "primereact/resources/themes/md-light-indigo/theme.css";
import "../node_modules/primeflex/primeflex.css";
import 'primeicons/primeicons.css';

import { RouterProvider } from 'react-router-dom';
import router from './routes/Router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>
  </StrictMode>,
)
