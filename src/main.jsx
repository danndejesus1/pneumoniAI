import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './pages/Homepage.jsx'
import Login from './pages/Login';
import AssessmentPage from './pages/AssessmentPage'; // Import the AssessmentPage component
import './firebase'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/assessment" element={<AssessmentPage />} /> {/* Add the new route here */}
        {/* other routes */}
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
