import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import DocumentUploader from '../documents/DocumentUploader';
import DocumentList from '../documents/DocumentList';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/Tabs';
import AssetModal from './AssetModal';
import AssetHistory from './AssetHistory';
import { Menu, MenuTrigger, MenuContent, MenuItem } from '../shared/Menu';
import { exportService } from '../../services/exportService';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          compliance_analysis (
            evaluation_date,
            residual_risk_rating,
            inherent_risk_rating,
            summary_analysis,
            created_at,
            updated_at
          ),
          documents (count)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAsset(data);
    } catch (error) {
      console.error('Error fetching asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAsset = async (updatedData) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setAsset(data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const handleExport = async (type) => {
    try {
      let exportData;
      let filename;

      switch (type) {
        case 'asset':
          exportData = await exportService.exportAssetData(id);
          filename = `asset_${id}.csv`;
          break;
        case 'history':
          exportData = await exportService.exportAssetHistory(id);
          filename = `asset_history_${id}.csv`;
          break;
        case 'documents':
          exportData = await exportService.exportDocuments(id, { includeFiles: true });
          filename = `asset_documents_${id}.${exportData.format}`;
          break;
        case 'all':
          exportData = await exportService.exportAll(id);
          filename = `asset_export_${id}.zip`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      exportService.downloadFile(exportData.data, filename, exportData.format);
    } catch (error) {
      console.error('Error exporting data:', error);
      // Add error notification here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const latestAnalysis = asset?.compliance_analysis?.[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{asset?.name || 'Loading...'}</h1>
        <div className="flex space-x-4">
          <Menu>
            <MenuTrigger>
              <Button variant="secondary">
                Export
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={() => handleExport('asset')}>
                Export Asset Data
              </MenuItem>
              <MenuItem onSelect={() => handleExport('history')}>
                Export History
              </MenuItem>
              <MenuItem onSelect={() => handleExport('documents')}>
                Export Documents
              </MenuItem>
              <MenuItem onSelect={() => handleExport('all')}>
                Export All
              </MenuItem>
            </MenuContent>
          </Menu>
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>
            Edit Asset
          </Button>
          <Button onClick={() => setShowUploader(true)}>
            Upload Document
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Asset Information">
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Unit</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.business_unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ownership Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.ownership_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Investment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.investment_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.industry}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Compliance Summary">
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Risk Rating</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${latestAnalysis?.residual_risk_rating === 'High' ? 'bg-red-100 text-red-800' :
                        latestAnalysis?.residual_risk_rating === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        latestAnalysis?.residual_risk_rating === 'Low' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {latestAnalysis?.residual_risk_rating || 'Not Rated'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Evaluation</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {latestAnalysis?.evaluation_date ? 
                      new Date(latestAnalysis.evaluation_date).toLocaleDateString() :
                      'Not evaluated'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {asset.documents?.[0]?.count || 0} documents
                  </dd>
                </div>
                {latestAnalysis?.summary_analysis && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Analysis Summary</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {latestAnalysis.summary_analysis}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <DocumentList assetId={id} />
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card title="Compliance Analysis">
            {latestAnalysis ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Residual Risk Rating</h3>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${latestAnalysis.residual_risk_rating === 'High' ? 'bg-red-100 text-red-800' :
                          latestAnalysis.residual_risk_rating === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {latestAnalysis.residual_risk_rating}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Inherent Risk Rating</h3>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${latestAnalysis.inherent_risk_rating === 'High' ? 'bg-red-100 text-red-800' :
                          latestAnalysis.inherent_risk_rating === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {latestAnalysis.inherent_risk_rating}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Evaluation Date</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(latestAnalysis.evaluation_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Analysis Summary</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {latestAnalysis.summary_analysis}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No compliance analysis available</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => navigate('/compliance/new')}
                >
                  Create Analysis
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card title="Asset History">
            <AssetHistory assetId={id} />
          </Card>
        </TabsContent>
      </Tabs>

      {showUploader && (
        <DocumentUploader
          assetId={id}
          onClose={() => setShowUploader(false)}
          onUploadComplete={fetchAsset}
        />
      )}

      {showEditModal && (
        <AssetModal
          show={showEditModal}
          asset={asset}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateAsset}
        />
      )}
    </div>
  );
};

export default AssetDetails;
