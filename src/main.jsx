import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './pages/Homepage.jsx'
import './firebase'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
