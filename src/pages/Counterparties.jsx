import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import Table from '../components/shared/Table';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

const Counterparties = () => {
  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounterparties();
  }, []);

  const fetchCounterparties = async () => {
    const { data, error } = await supabase
      .from('counterparties')
      .select(`
        *,
        assets (name),
        transactions (type, date)
      `);
    
    if (!error) {
      setCounterparties(data);
    }
    setLoading(false);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    {
      key: 'assets',
      label: 'Related Assets',
      render: (row) => row.assets?.name || 'N/A'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="small"
          onClick={() => handleView(row.id)}
        >
          View Details
        </Button>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <Card title="Counterparties">
      <div className="mb-4">
        <Button variant="primary" onClick={() => handleAdd()}>
          Add Counterparty
        </Button>
      </div>
      <Table
        columns={columns}
        data={counterparties}
        onRowClick={(row) => handleView(row.id)}
      />
    </Card>
  );
};

export default Counterparties;
