import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import Table from '../shared/Table';
import Card from '../shared/Card';
import Button from '../shared/Button';
import AssetModal from './AssetModal';

const AssetList = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if we're authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Authentication error. Please sign in again.');
      if (!user) throw new Error('No authenticated user found');

      // First get the asset access records for the user
      const { data: accessData, error: accessError } = await supabase
        .from('asset_access')
        .select('asset_id, can_view, can_edit')
        .eq('user_id', user.id)
        .eq('can_view', true);

      if (accessError) {
        console.error('Access query error:', accessError);
        throw accessError;
      }

      if (!accessData || accessData.length === 0) {
        console.log('No assets found with access');
        setAssets([]);
        return;
      }

      const assetIds = accessData.map(a => a.asset_id);

      // Then get the assets with their related data
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          codename,
          business_unit:business_units!inner(id, name),
          industry:industries!inner(id, name),
          currency:currencies!inner(id, code),
          ownership_type,
          investment_type,
          status
        `)
        .in('id', assetIds)
        .order('name');

      if (assetsError) {
        console.error('Assets query error:', assetsError);
        throw assetsError;
      }

      console.log('Fetched assets:', assetsData); // Debug log
      
      // Combine asset data with access info
      const assetsWithAccess = assetsData.map(asset => ({
        ...asset,
        access: accessData.find(a => a.asset_id === asset.id)
      }));

      setAssets(assetsWithAccess || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setError(error.message || 'Failed to load assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = () => {
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    if (refresh) {
      fetchAssets();
    }
  };

  const columns = [
    { header: 'NAME', accessor: 'name' },
    { header: 'CODENAME', accessor: 'codename' },
    { header: 'BUSINESS UNIT', accessor: row => row.business_unit?.name },
    { header: 'OWNERSHIP TYPE', accessor: 'ownership_type' },
    { header: 'INVESTMENT TYPE', accessor: 'investment_type' },
    { header: 'INDUSTRY', accessor: row => row.industry?.name },
    { header: 'STATUS', accessor: 'status' },
    {
      header: 'ACTIONS',
      accessor: 'id',
      cell: (value) => (
        <Button
          onClick={() => navigate(`/assets/${value}`)}
          variant="secondary"
          size="small"
        >
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div>Loading assets...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Button onClick={handleAddAsset}>Add Asset</Button>
      </div>

      <Table
        data={assets}
        columns={columns}
        emptyMessage="No assets found"
      />

      {showModal && (
        <AssetModal
          isOpen={showModal}
          onClose={handleModalClose}
        />
      )}
    </Card>
  );
};

export default AssetList;
