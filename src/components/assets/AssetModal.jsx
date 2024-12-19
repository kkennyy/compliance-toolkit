import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Button from '../shared/Button';
import { supabase } from '../../config/supabaseClient';

const AssetModal = ({ show, asset, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    codename: '',
    business_unit: '',
    ownership_type: '',
    investment_type: '',
    industry: '',
    status: 'Pending',
    description: '',
    investment_date: '',
    exit_date: '',
    target_exit_date: '',
    investment_amount: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [industries, setIndustries] = useState([]);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        codename: asset.codename || '',
        business_unit: asset.business_unit || '',
        ownership_type: asset.ownership_type || '',
        investment_type: asset.investment_type || '',
        industry: asset.industry || '',
        status: asset.status || 'Pending',
        description: asset.description || '',
        investment_date: asset.investment_date || '',
        exit_date: asset.exit_date || '',
        target_exit_date: asset.target_exit_date || '',
        investment_amount: asset.investment_amount || '',
        currency: asset.currency || 'USD'
      });
    }
    fetchReferenceData();
  }, [asset]);

  const fetchReferenceData = async () => {
    try {
      // Fetch business units
      const { data: buData } = await supabase
        .from('business_units')
        .select('name')
        .order('name');
      
      if (buData) {
        setBusinessUnits(buData.map(bu => bu.name));
      }

      // Fetch industries
      const { data: indData } = await supabase
        .from('industries')
        .select('name')
        .order('name');
      
      if (indData) {
        setIndustries(indData.map(ind => ind.name));
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog.Root open={show} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {asset ? 'Edit Asset' : 'Create Asset'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code Name
                </label>
                <input
                  type="text"
                  name="codename"
                  value={formData.codename}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Unit*
                </label>
                <select
                  name="business_unit"
                  value={formData.business_unit}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Business Unit</option>
                  {businessUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ownership Type*
                </label>
                <select
                  name="ownership_type"
                  value={formData.ownership_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Ownership Type</option>
                  <option value="Direct">Direct</option>
                  <option value="Indirect">Indirect</option>
                  <option value="Joint Venture">Joint Venture</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Investment Type*
                </label>
                <select
                  name="investment_type"
                  value={formData.investment_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Investment Type</option>
                  <option value="Equity">Equity</option>
                  <option value="Debt">Debt</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Industry*
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status*
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Exited">Exited</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Investment Date
                  </label>
                  <input
                    type="date"
                    name="investment_date"
                    value={formData.investment_date}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target Exit Date
                  </label>
                  <input
                    type="date"
                    name="target_exit_date"
                    value={formData.target_exit_date}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Investment Amount
                  </label>
                  <input
                    type="number"
                    name="investment_amount"
                    value={formData.investment_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : asset ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AssetModal;
