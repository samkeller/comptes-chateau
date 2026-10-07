import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api';
import '../src/assets/index.css'
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { GlobalToastProvider } from '../src/context/GlobalToastContext';
import ScanStockPage from '../src/pages/stocks/ScanStockPage';
const router = createMemoryRouter([{ path: "/", element: <ScanStockPage /> }]);
createRoot(document.getElementById('root')!).render(
  <StrictMode><PrimeReactProvider><GlobalToastProvider><RouterProvider router={router} /></GlobalToastProvider></PrimeReactProvider></StrictMode>)
