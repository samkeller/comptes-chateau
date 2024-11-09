import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api';
import './index.css'
import Datas from './pages/datas/Datas';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider>
        <Datas />
        Salut
    </PrimeReactProvider>
  </StrictMode>,
)
