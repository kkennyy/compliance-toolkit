import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useAssets } from '../../hooks/useAssets';
import AssetModal from './AssetModal';

const AssetList = () => {
  const { assets = [], loading, error, refetch } = useAssets();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleAddAsset = async (assetData) => {
    try {
      const { error } = await supabase.from('assets').insert([assetData]).single();
      if (error) throw error;
      refetch();
      setShowModal(false);
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const handleEditAsset = async (assetData) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update(assetData)
        .eq('id', selectedAsset.id)
        .single();
      if (error) throw error;
      refetch();
      setShowModal(false);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const addSampleData = async () => {
    const sampleAssets = [
      { name: 'Sample Asset 1', codename: 'S1', business_unit: 'Unit 1', status: 'Active' },
      { name: 'Sample Asset 2', codename: 'S2', business_unit: 'Unit 2', status: 'Inactive' },
    ];
    try {
      const { error } = await supabase.from('assets').insert(sampleAssets);
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error adding sample data:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Assets</h1>
      <button onClick={() => addSampleData()}>Add Sample Data</button>
      <ul>
        {assets.map((asset) => (
          <li key={asset.id}>
            {asset.name} - {asset.codename}
            <button onClick={() => navigate(`/assets/${asset.id}`)}>View</button>
          </li>
        ))}
      </ul>
      {showModal && (
        <AssetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={selectedAsset ? handleEditAsset : handleAddAsset}
          initialData={selectedAsset}
        />
      )}
    </div>
  );
};

export default AssetList;
