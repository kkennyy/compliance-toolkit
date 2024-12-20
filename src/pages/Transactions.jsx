import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../config/supabaseClient';
import Table from '../components/shared/Table';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';

const Transactions = forwardRef(({ isNew, parentId, parentType }, ref) => {
  const [transactions, setTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Transactions useEffect triggered with parentId:', parentId, 'isNew:', isNew);
    if (!isNew) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [parentId]);

  const fetchTransactions = async () => {
    console.log('fetchTransactions called with parentId:', parentId, 'parentType:', parentType);
    if (!parentId) {
      console.log('No parentId provided, skipping fetch');
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        assets (name),
        counterparties (name)
      `)
      .eq(parentType === 'asset' ? 'asset_id' : 'counterparty_id', parentId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      console.log('Transactions fetched:', data);
      setTransactions(data);
    }
    setLoading(false);
  };

  const addTransaction = async (transactionData) => {
    console.log('addTransaction called with:', { transactionData, isNew, parentId, parentType });
    if (isNew) {
      // Store in pending state if parent entity is new
      setPendingTransactions([
        ...pendingTransactions,
        {
          ...transactionData,
          id: Date.now(), // Temporary ID for UI purposes
          date: new Date().toISOString()
        }
      ]);
      return;
    }

    // Otherwise, add directly to database
    const { error } = await supabase
      .from('transactions')
      .insert({
        ...transactionData,
        [parentType === 'asset' ? 'asset_id' : 'counterparty_id']: parentId
      });

    if (!error) {
      fetchTransactions();
    }
  };

  const removeTransaction = async (transactionId) => {
    if (isNew) {
      // Remove from pending state
      setPendingTransactions(pendingTransactions.filter(t => t.id !== transactionId));
      return;
    }

    // Remove from database
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (!error) {
      fetchTransactions();
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    linkPendingTransactions: async (newParentId) => {
      try {
        for (const transaction of pendingTransactions) {
          const { error } = await supabase
            .from('transactions')
            .insert({
              ...transaction,
              [parentType === 'asset' ? 'asset_id' : 'counterparty_id']: newParentId
            });
          
          if (error) throw error;
        }
        // Clear pending transactions
        setPendingTransactions([]);
      } catch (error) {
        console.error('Error linking pending transactions:', error);
      }
    }
  }));

  const displayTransactions = isNew ? pendingTransactions : transactions;

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
      label: 'Interest Amount',
      render: (row) => formatCurrency(row.interest_amount)
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => removeTransaction(row.id)}
        >
          Remove
        </Button>
      )
    }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <Card title="Transactions">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => addTransaction({})}>
            Add Transaction
          </Button>
        </div>
        <Table
          columns={columns}
          data={displayTransactions}
          emptyMessage="No transactions found"
        />
      </div>
    </Card>
  );
});

export default Transactions;
