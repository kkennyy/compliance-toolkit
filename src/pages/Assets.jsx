import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Table from '../components/shared/Table';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import AssetModal from '../components/assets/AssetModal';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
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

      if (error) throw error;
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleView(row.id)}
          >
            View Details
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
        </div>
      )
    }
  ];

  const handleAddAsset = () => {
    setSelectedAsset(null); // Clear the selected asset for adding a new one
    setShowModal(true);
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset); // Set the selected asset for editing
    setShowModal(true);
  };

  const handleView = (id) => {
    navigate(`/assets/${id}`);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedAsset) {
        // Edit existing asset
        const { error } = await supabase
          .from('assets')
          .update(formData)
          .eq('id', selectedAsset.id);

        if (error) throw error;
      } else {
        // Add new asset
        const { error } = await supabase.from('assets').insert(formData);
        if (error) throw error;
      }

      setShowModal(false);
      fetchAssets(); // Refresh the asset list
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Card title="Assets">
        <div className="mb-4">
          <Button variant="primary" onClick={handleAddAsset}>
            Add Asset
          </Button>
        </div>
        <Table columns={columns} data={assets} />
      </Card>
      {showModal && (
        <AssetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          initialData={selectedAsset}
        />
      )}
    </>
  );
};

export default Assets;
