import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './pages/Homepage.jsx'
import Login from './pages/Login';
import AssessmentPage from './pages/AssessmentPage'; 
import ResultPage from './pages/ResultPage';
import './lib/transitions.css';
import './firebase'
import {AuthProvider} from './context/AuthContext.jsx';

function AnimatedRoutes() {
  const location = useLocation();

  // simple side-effect so the browser paints fresh on route change (helps CSS animation on mount)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Use a keyed wrapper to retrigger CSS animations on route change.
  return (
    <div key={location.pathname} className="route-fade page-wrapper">
      <Routes location={location}>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/assessment" element={<AssessmentPage />} />
         <Route path="/result" element={<ResultPage />} />
        {/* other routes */}
      </Routes>
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
          <AppRouter/>
      </AuthProvider>
  </StrictMode>,
)
