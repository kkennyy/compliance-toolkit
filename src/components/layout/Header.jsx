import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!session) return null;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-gray-900">
                Compliance Toolkit
              </span>
            </div>
            <nav className="ml-6 flex space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Assets
              </Link>
              <Link
                to="/counterparties"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Counterparties
              </Link>
              <Link
                to="/transactions"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Transactions
              </Link>
              <Link
                to="/reports"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
