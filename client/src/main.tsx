import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { PWAInstallProvider } from './context/PWAInstallContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <PWAInstallProvider>
        <App />
      </PWAInstallProvider>
    </NotificationProvider>
  </StrictMode>,
)
