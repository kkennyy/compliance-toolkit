import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Table from '../shared/Table';
import Card from '../shared/Card';
import Button from '../shared/Button';

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        id,
        name,
        codename,
        business_unit,
        ownership_type,
        investment_type,
        industry,
        status
      `);

    if (!error) {
      setAssets(data);
    }
    setLoading(false);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'codename', label: 'Codename' },
    { key: 'business_unit', label: 'Business Unit' },
    { key: 'ownership_type', label: 'Ownership Type' },
    { key: 'investment_type', label: 'Investment Type' },
    { key: 'industry', label: 'Industry' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.status === 'Invested'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.status || 'Unknown'}
        </span>
      )
    },
    {
      key: '
