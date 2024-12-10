import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Assets from './pages/Assets';
import Counterparties from './pages/Counterparties';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import LoginForm from './components/auth/LoginForm';
import { useAuth } from './hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Assets />
                </PrivateRoute>
              }
            />
            <Route
              path="/counterparties"
              element={
                <PrivateRoute>
                  <Counterparties />
                </PrivateRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <PrivateRoute>
                  <Transactions />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
