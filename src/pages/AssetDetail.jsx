import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import DocumentUploader from '../components/documents/DocumentUploader';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('administrative');

  useEffect(() => {
    fetchAssetData();
  }, [id]);

  async function fetchAssetData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          business_unit:business_units (id, name),
          industry:industries (id, name),
          currency:currencies (id, code),
          asset_counterparties (
            counterparty:counterparties (
              id,
              name
            ),
            role
          ),
          asset_personnel (
            id,
            role_override,
            personnel (
              id,
              name,
              role,
              jurisdiction
            )
          ),
          transactions (
            id,
            name,
            type,
            description,
            date,
            counterparty:counterparties (
              id,
              name,
              type,
              counterparty_controllers (
                controller:controllers (
                  id,
                  name
                )
              )
            ),
            transaction_compliance_analysis (
              id,
              evaluation_date,
              residual_risk_rating,
              inherent_risk_rating,
              summary_analysis,
              methodology
            )
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
  }

  const renderAdministrativeDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-bold mb-4">General Information</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-medium py-2">Name</td>
                <td>{asset.name}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Codename</td>
                <td>{asset.codename}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Description</td>
                <td>{asset.description}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Business Unit</td>
                <td>{asset.business_unit?.name}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Ownership Type</td>
                <td>{asset.ownership_type}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Ownership Medium</td>
                <td>{asset.ownership_medium}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Investment Type</td>
                <td>{asset.investment_type}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Interest Invested (%)</td>
                <td>{asset.interest_invested_percentage}%</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Interest Invested</td>
                <td>{asset.interest_invested_amount} {asset.currency?.code}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Jurisdictions</td>
                <td>{asset.jurisdictions?.join(', ')}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Industry</td>
                <td>{asset.industry?.name}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Status</td>
                <td>{asset.status}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Investment Date</td>
                <td>{new Date(asset.investment_date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td className="font-medium py-2">Managing Office</td>
                <td>{asset.managing_office}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-4">Counterparties</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {asset.asset_counterparties?.map(({ counterparty, role }) => (
                <tr key={counterparty.id}>
                  <td>{counterparty.name}</td>
                  <td>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-lg font-bold mt-8 mb-4">ORP Personnel</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Role</th>
                <th className="text-left">Jurisdiction</th>
              </tr>
            </thead>
            <tbody>
              {asset.asset_personnel?.map(({ personnel, role_override }) => (
                <tr key={`${personnel.id}-${role_override || 'primary'}`}>
                  <td>{personnel.name}</td>
                  <td>{role_override || personnel.role}</td>
                  <td>{personnel.jurisdiction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      {asset.transactions?.map(transaction => (
        <Card key={transaction.id}>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{transaction.name}</h3>
                <p className="text-gray-600">{transaction.type}</p>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium">Description</h4>
              <p>{transaction.description}</p>

              <h4 className="font-medium mt-4">Counterparty</h4>
              <p>{transaction.counterparty?.name}</p>
              <p className="text-sm text-gray-600">{transaction.counterparty?.type}</p>
              
              {transaction.counterparty?.counterparty_controllers?.length > 0 && (
                <>
                  <h4 className="font-medium mt-4">Controllers</h4>
                  <div className="space-y-1">
                    {transaction.counterparty.counterparty_controllers.map(({ controller }) => (
                      <p key={controller.id}>{controller.name}</p>
                    ))}
                  </div>
                </>
              )}
            </div>

            {transaction.transaction_compliance_analysis?.[0] && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium">Compliance Analysis</h4>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Evaluation Date: </span>
                    {new Date(transaction.transaction_compliance_analysis[0].evaluation_date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Residual Risk: </span>
                    {transaction.transaction_compliance_analysis[0].residual_risk_rating}
                  </p>
                  <p>
                    <span className="font-medium">Inherent Risk: </span>
                    {transaction.transaction_compliance_analysis[0].inherent_risk_rating}
                  </p>
                  <p>
                    <span className="font-medium">Summary: </span>
                    {transaction.transaction_compliance_analysis[0].summary_analysis}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderLinkedAssets = () => (
    <div className="space-y-6">
      <p className="text-gray-500">No linked assets found.</p>
    </div>
  );

  const renderComplianceAnalysis = () => (
    <div className="space-y-6">
      {asset.compliance_analysis?.map((analysis, index) => (
        <Card key={analysis.id}>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Evaluation {index + 1}</h3>
                <p className="text-gray-600">Date: {new Date(analysis.evaluation_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium">Residual Risk Rating</h4>
              <p>{analysis.residual_risk_rating}</p>
              <h4 className="font-medium mt-2">Inherent Risk Rating</h4>
              <p>{analysis.inherent_risk_rating}</p>
              <h4 className="font-medium mt-2">Summary Analysis</h4>
              <p>{analysis.summary_analysis}</p>
              <h4 className="font-medium mt-2">Methodology</h4>
              <p>{analysis.methodology}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderFileRepository = () => (
    <div className="space-y-6">
      <DocumentUploader assetId={id} />
    </div>
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!asset) return <div>Asset not found</div>;

  const tabs = [
    { id: 'administrative', name: 'Administrative Details' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'linked', name: 'Linked Assets' },
    { id: 'compliance', name: 'Compliance Analysis' },
    { id: 'files', name: 'File Repository' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              <Link to="/assets" className="text-blue-600 hover:text-blue-800">Assets</Link>
              <span className="text-gray-500 mx-2">></span>
              {asset.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-2xl shadow-lg">
        <div className="px-8 py-8">
          {activeTab === 'administrative' && renderAdministrativeDetails()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'linked' && renderLinkedAssets()}
          {activeTab === 'compliance' && renderComplianceAnalysis()}
          {activeTab === 'files' && renderFileRepository()}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
