import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Compliance Toolkit</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium">
              Assets
            </Link>
            <Link to="/counterparties" className="px-3 py-2 rounded-md text-sm font-medium">
              Counterparties
            </Link>
            <Link to="/transactions" className="px-3 py-2 rounded-md text-sm font-medium">
              Transactions
            </Link>
            <Link to="/reports" className="px-3 py-2 rounded-md text-sm font-medium">
              Reports
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
