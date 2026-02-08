import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import ConfigBoard from './pages/ConfigBoard';
import SharedConfig from './pages/SharedConfig';
import Home from './pages/Home';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Page wrapper for animations
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    style={{ minHeight: '100vh' }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
        <Route path="/shared/:token" element={<PageWrapper><SharedConfig /></PageWrapper>} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PageWrapper><Dashboard /></PageWrapper>
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <PrivateRoute>
              <PageWrapper><ProjectView /></PageWrapper>
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:id/configs"
          element={
            <PrivateRoute>
              <PageWrapper><ConfigBoard /></PageWrapper>
            </PrivateRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
