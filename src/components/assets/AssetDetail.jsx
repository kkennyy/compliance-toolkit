import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching asset details:', error);
    }
    setAsset(data);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!asset) return <div>Asset not found.</div>;

  return (
    <Card title={asset.name}>
      <div className="mb-4">
        <button
          onClick={() => navigate('/assets')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Assets
        </button>
      </div>
      <div className="border-b mb-4">
        {['Details', 'Transactions', 'Compliance'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 ${
              activeTab === tab.toLowerCase()
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>{activeTab === 'details' ? 'Details Content Here' : 'Other Tabs'}</div>
    </Card>
  );
};

export default AssetDetail;
