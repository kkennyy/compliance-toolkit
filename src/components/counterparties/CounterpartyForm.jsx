import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';

const CounterpartyForm = ({ counterparty, onSave }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    entity_type: '',
    type: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (counterparty) {
      setFormData({
        name: counterparty.name || '',
        entity_type: counterparty.entity_type || '',
        type: counterparty.type || '',
        description: counterparty.description || ''
      });
    }
  }, [counterparty]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Insert or update counterparty
      const { data, error: counterpartyError } = await supabase
        .from('counterparties')
        .upsert({
          ...(counterparty?.id ? { id: counterparty.id } : {}),
          ...formData
        })
        .select()
        .single();

      if (counterpartyError) throw counterpartyError;

      if (onSave) {
        onSave(data);
      } else {
        // If we're creating a new counterparty, navigate to its detail page
        navigate(`/counterparties/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving counterparty:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Entity Type
        </label>
        <input
          type="text"
          name="entity_type"
          value={formData.entity_type}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <input
          type="text"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/counterparties')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`
            px-4 py-2 text-sm font-medium text-white rounded-md
            ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
          `}
        >
          {loading ? 'Saving...' : counterparty ? 'Save Changes' : 'Create Counterparty'}
        </button>
      </div>
    </form>
  );
};

export default CounterpartyForm;
