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
  const [filters, setFilters] = useState({
    status: '',
    business_unit: '',
    ownership_type: '',
    investment_type: '',
    industry: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [filters]);

  const fetchAssets = async () => {
    try {
      let query = supabase
        .from('assets')
        .select(`
          id,
          name,
          codename,
          business_unit,
          ownership_type,
          investment_type,
          industry,
          status,
          created_at,
          last_updated,
          documents:documents (count),
          compliance_analysis:compliance_analysis (
            residual_risk_rating
          )
        `);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });

      // Apply search
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,codename.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;
      setAssets([data, ...assets]);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const columns = [
    { 
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div>
          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
               onClick={() => navigate(`/assets/${row.id}`)}>
            {row.name}
          </div>
          {row.codename && (
            <div className="text-sm text-gray-500">
              {row.codename}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'business_unit',
      label: 'Business Unit',
      render: (row) => (
        <div className="text-sm">
          {row.business_unit}
        </div>
      )
    },
    {
      key: 'ownership_type',
      label: 'Ownership',
      render: (row) => (
        <div className="text-sm">
          {row.ownership_type}
        </div>
      )
    },
    {
      key: 'investment_type',
      label: 'Investment Type',
      render: (row) => (
        <div className="text-sm">
          {row.investment_type}
        </div>
      )
    },
    {
      key: 'industry',
      label: 'Industry',
      render: (row) => (
        <div className="text-sm">
          {row.industry}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full
          ${row.status === 'Active' ? 'bg-green-100 text-green-800' :
            row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            row.status === 'Exited' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'}`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'risk',
      label: 'Risk Rating',
      render: (row) => {
        const rating = row.compliance_analysis?.[0]?.residual_risk_rating;
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full
            ${rating === 'High' ? 'bg-red-100 text-red-800' :
              rating === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              rating === 'Low' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'}`}>
            {rating || 'Not Rated'}
          </span>
        );
      }
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (row) => (
        <div className="text-sm">
          {row.documents?.length || 0} documents
        </div>
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
            onClick={() => navigate(`/assets/${row.id}`)}
          >
            View Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <Button onClick={() => setShowModal(true)}>
          Create Asset
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {Object.entries(filters).map(([key, value]) => (
              <select
                key={key}
                value={value}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">{key.replace(/_/g, ' ')}</option>
                {/* Add options dynamically based on available values */}
              </select>
            ))}
          </div>

          <Table
            data={assets}
            columns={columns}
            loading={loading}
            emptyMessage="No assets found"
          />
        </div>
      </Card>

      <AssetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateAsset}
      />
    </div>
  );
};

export default AssetList;
