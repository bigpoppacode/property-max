import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Results from './pages/Results';
import Navbar from './components/Navbar';

export default function App() {
  const [navVisible, setNavVisible] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-medium focus:shadow-lg">
        Skip to main content
      </a>
      <Navbar visible={!isLanding || navVisible} />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing onNavVisibilityChange={setNavVisible} />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
