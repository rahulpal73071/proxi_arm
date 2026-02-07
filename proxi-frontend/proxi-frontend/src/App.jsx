/**
 * Main App Component
 * 
 * Root component that sets up routing and global context.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProxiProvider } from './contexts/ProxiContext';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <ProxiProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </ProxiProvider>
  );
}

export default App;
