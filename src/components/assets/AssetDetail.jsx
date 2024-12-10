import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          counterparties (
            id,
            name,
            role
          ),
          transactions (
            id,
            date,
            type,
            description
          ),
          compliance_analysis (
            id,
            evaluation_date,
            residual_risk_rating,
            inherent_risk_rating,
            summary_analysis,
            methodology
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAsset(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-red-600">Error: {error}</div>
    </div>
  );

  if (!asset) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">Asset not found</div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/assets')}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Assets
          </button>
          <h1 className="text-2xl font-bold">{asset.name}</h1>
          <p className="text-gray-500">Codename: {asset.codename}</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate(`/assets/${id}/edit`)}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['Administrative Details', 'Transactions', 'Linked Assets', 'Compliance Analysis', 'File Repository'].map((tab) => {
            const tabId = tab.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabId)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tabId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'administrative-details' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">General Information</h3>
              <dl className="grid grid-cols-2 gap-4">
                {Object.entries({
                  'Business Unit': asset.business_unit,
                  'Ownership Type': asset.ownership_type,
                  'Investment Type': asset.investment_type,
                  'Industry': asset.industry,
                  'Status': asset.status,
                  'Invested Date': asset.invested_date,
                }).map(([key, value]) => (
                  <div key={key} className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Description</h3>
              <p className="text-sm text-gray-600">{asset.description || '-'}</p>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Transactions</h3>
            {asset.transactions?.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {asset.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transaction.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transaction.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No transactions found</p>
            )}
          </div>
        )}

        {activeTab === 'compliance-analysis' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Compliance Analysis</h3>
            {asset.compliance_analysis ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Residual Risk Rating</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {asset.compliance_analysis.residual_risk_rating}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Inherent Risk Rating</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {asset.compliance_analysis.inherent_risk_rating}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Summary Analysis</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {asset.compliance_analysis.summary_analysis}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Methodology</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {asset.compliance_analysis.methodology}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No compliance analysis found</p>
            )}
          </div>
        )}

        {/* Add other tab contents as needed */}
      </div>
    </div>
  );
};

export default AssetDetail;
