import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useAssets } from '../../hooks/useAssets';
import AssetModal from './AssetModal';

const AssetList = () => {
  const { assets, loading, error, refetch } = useAssets();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleAddAsset = async (assetData) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert([assetData])
        .single();

      if (error) throw error;
      refetch();
      setShowModal(false);
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('Error adding asset: ' + error.message);
    }
  };

  const handleEditAsset = async (assetData) => {
    try {
      const { data, error } = await supabase
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
      alert('Error updating asset: ' + error.message);
    }
  };

  const addSampleData = async () => {
    const sampleAssets = [
      {
        name: "Buns Logistics Fund",
        codename: "Blade",
        description: "Australia-based food delivery platform",
        business_unit: "ABC Investor Properties",
        ownership_type: "Direct",
        investment_type: "Capital",
        jurisdictions: ["Australia"],
        industry: "Real Estate",
        status: "Invested"
      },
      {
        name: "Onion Capital Asia Pte. Ltd.",
        codename: "Onion",
        description: "Singapore-based fund manager",
        business_unit: "Global Equities",
        ownership_type: "Direct",
        investment_type: "Equity",
        jurisdictions: ["Singapore"],
        industry: "Fund Management",
        status: "Invested"
      }
    ];

    try {
      const { data, error } = await supabase
        .from('assets')
        .insert(sampleAssets);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error adding sample data:', error);
      alert('Error adding sample data: ' + error.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-red-600">Error: {error.message}</div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <div className="space-x-4">
          <button
            onClick={() => {
              setSelectedAsset(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add New Asset
          </button>
          {assets.length === 0 && (
            <button
              onClick={addSampleData}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Add Sample Data
            </button>
          )}
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No assets found</p>
          <button
            onClick={addSampleData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Sample Data
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.codename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.business_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      asset.status === 'Invested' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setShowModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAsset(null);
        }}
        onSubmit={selectedAsset ? handleEditAsset : handleAddAsset}
        initialData={selectedAsset}
      />
    </div>
  );
};

export default AssetList;
