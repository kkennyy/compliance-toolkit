import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import Table from '../components/shared/Table';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        assets (name),
        counterparties (name)
      `)
      .order('date', { ascending: false });
    
    if (!error) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => formatDate(row.date)
    },
    { key: 'type', label: 'Type' },
    {
      key: 'assets',
      label: 'Asset',
      render: (row) => row.assets?.name
    },
    {
      key: 'counterparties',
      label: 'Counterparty',
      render: (row) => row.counterparties?.name
    },
    {
      key: 'interest_amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.interest_amount)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="space-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleView(row.id)}
          >
            View
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() => handleEdit(row.id)}
          >
            Edit
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <Card title="Transactions">
      <div className="mb-4">
        <Button variant="primary" onClick={() => handleAdd()}>
          New Transaction
        </Button>
      </div>
      <Table columns={columns} data={transactions} />
    </Card>
  );
};

export default Transactions;
