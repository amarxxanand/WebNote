import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NoteProvider } from './contexts/NoteContext';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import SharedNote from './pages/SharedNote';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <NoteProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route path="/shared/:shareLink" element={<SharedNote />} />
          </Routes>
        </div>
      </NoteProvider>
    </AuthProvider>
  );
}

export default App; 