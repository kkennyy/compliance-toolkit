import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Assets from './pages/Assets';
import Counterparties from './pages/Counterparties';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';
import { useAuth } from './hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session?.user) {
      navigate('/login', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return session?.user ? children : null;
};

const PublicRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return !session?.user ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUpForm /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Assets /></PrivateRoute>} />
          <Route path="/counterparties" element={<PrivateRoute><Counterparties /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
};

export default App;
