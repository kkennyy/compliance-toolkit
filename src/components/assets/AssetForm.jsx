import React, { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const AssetForm = ({ asset, onSubmit, onCancel }) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState(asset || {
    name: '',
    codename: '',
    description: '',
    business_unit: '',
    ownership_type: '',
    investment_type: '',
    jurisdictions: [],
    industry: '',
    status: 'Pending'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = asset?.id
      ? await supabase
          .from('assets')
          .update(formData)
          .eq('id', asset.id)
      : await supabase
          .from('assets')
          .insert({ ...formData, created_by: session.user.id });

    if (error) {
      console.error('Error saving asset:', error);
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      {/* Add other fields similarly */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default AssetForm;
