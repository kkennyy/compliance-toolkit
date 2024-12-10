import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Assets from './pages/Assets';
import Counterparties from './pages/Counterparties';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm'; // Add this import

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
            <Route path="/signup" element={<SignUpForm />} /> {/* Add this route */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Assets />
                </PrivateRoute>
              }
            />
            {/* ... other routes ... */}
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
