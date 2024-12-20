import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <>
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 fixed w-full z-50 shadow-lg">
        <div className="max-w-[1024px] mx-auto px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-md text-white hover:bg-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="text-2xl font-bold text-white ml-2 md:ml-0 hover:opacity-90 transition-opacity">
                Compliance Toolkit
              </Link>
            </div>
            <nav className="hidden md:flex space-x-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-150 ${
                    isCurrentPath(item.path, item.exact)
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-white hover:bg-blue-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <span className="hidden md:block text-sm font-medium text-white opacity-90">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-1.5 text-sm font-semibold text-blue-700 bg-white rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white transform transition-transform md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 bg-blue-600">
          <span className="text-xl font-bold text-white">Menu</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md text-white hover:bg-blue-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-4 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`block px-4 py-2 rounded-md text-base font-medium ${
                isCurrentPath(item.path, item.exact)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Header;
