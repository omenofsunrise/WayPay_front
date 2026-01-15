import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PhoneUtilsProvider } from './utils/phoneUtils'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PhoneUtilsProvider>
      <App />
    </PhoneUtilsProvider>
  </StrictMode>,
)
