import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import Table from '../components/shared/Table';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

const Assets = () => {
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
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="small"
          onClick={() => console.log(`View Asset ID: ${row.id}`)}
        >
          View Details
        </Button>
      )
    }
  ];

  const handleAddAsset = () => {
    console.log('Add Asset clicked');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card title="Assets">
      <div className="mb-4">
        <Button variant="primary" onClick={handleAddAsset}>
          Add Asset
        </Button>
      </div>
      <Table columns={columns} data={assets} />
    </Card>
  );
};

export default Assets;
