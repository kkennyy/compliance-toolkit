import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  console.log('Header rendering'); // Add this line
  const { session, loading, signOut } = useAuth();
  console.log('Header auth state:', { session, loading }); // Add this line
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      const { error } = await signOut();
      if (!error) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Don't render during loading or without session
  if (loading || !session?.user) {
    return null;
  }

  const menuItems = [
    { path: '/', label: 'Assets', exact: true },
    { path: '/counterparties', label: 'Counterparties' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/reports', label: 'Reports' }
  ];

  const isCurrentPath = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900">
                Compliance Toolkit
              </Link>
            </div>
            <nav className="ml-6 flex space-x-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isCurrentPath(item.path, item.exact)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            {session?.user?.email && (
              <span className="text-sm text-gray-600 mr-4">
                {session.user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
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
