import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Assets' },
    { path: '/counterparties', label: 'Counterparties' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/reports', label: 'Reports' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <nav className="mt-5 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              location.pathname === item.path
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
