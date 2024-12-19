import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Button from '../shared/Button';
import { supabase } from '../../config/supabaseClient';

const AssetModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    codename: '',
    business_unit_id: '',
    industry_id: '',
    currency_id: '',
    ownership_type: '',
    investment_type: '',
    status: 'Pending',
    investment_amount: '',
    investment_date: '',
    target_exit_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [buResponse, indResponse, currResponse] = await Promise.all([
        supabase.from('business_units').select('id, name').eq('active', true),
        supabase.from('industries').select('id, name').eq('active', true),
        supabase.from('currencies').select('id, code, symbol').eq('active', true)
      ]);

      if (buResponse.error) throw buResponse.error;
      if (indResponse.error) throw indResponse.error;
      if (currResponse.error) throw currResponse.error;

      setBusinessUnits(buResponse.data || []);
      setIndustries(indResponse.data || []);
      setCurrencies(currResponse.data || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      setError('Failed to load reference data. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('assets')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      // Grant access to the creator
      const { error: accessError } = await supabase
        .from('asset_access')
        .insert([{
          asset_id: data.id,
          user_id: (await supabase.auth.getUser()).data.user.id,
          can_view: true,
          can_edit: true
        }]);

      if (accessError) throw accessError;

      onClose(true); // Refresh the asset list
    } catch (error) {
      console.error('Error creating asset:', error);
      setError('Failed to create asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <Dialog.Title className="text-xl font-bold mb-4">Add New Asset</Dialog.Title>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Codename</label>
              <input
                type="text"
                name="codename"
                value={formData.codename}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Unit *</label>
              <select
                name="business_unit_id"
                value={formData.business_unit_id}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Business Unit</option>
                {businessUnits.map(bu => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry *</label>
              <select
                name="industry_id"
                value={formData.industry_id}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Industry</option>
                {industries.map(ind => (
                  <option key={ind.id} value={ind.id}>{ind.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Investment Amount</label>
                <input
                  type="number"
                  name="investment_amount"
                  value={formData.investment_amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Currency *</label>
                <select
                  name="currency_id"
                  value={formData.currency_id}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Currency</option>
                  {currencies.map(curr => (
                    <option key={curr.id} value={curr.id}>{curr.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ownership Type *</label>
              <select
                name="ownership_type"
                value={formData.ownership_type}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Ownership Type</option>
                <option value="Direct">Direct</option>
                <option value="Fund">Fund</option>
                <option value="Joint Venture">Joint Venture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Investment Type *</label>
              <select
                name="investment_type"
                value={formData.investment_type}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Investment Type</option>
                <option value="Growth Equity">Growth Equity</option>
                <option value="Venture Capital">Venture Capital</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Private Equity">Private Equity</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Investment Date</label>
                <input
                  type="date"
                  name="investment_date"
                  value={formData.investment_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target Exit Date</label>
                <input
                  type="date"
                  name="target_exit_date"
                  value={formData.target_exit_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onClose(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AssetModal;
