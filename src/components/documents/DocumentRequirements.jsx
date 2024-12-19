import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Card from '../shared/Card';

const DocumentRequirements = ({ assetId }) => {
  const [requirements, setRequirements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [assetId]);

  const fetchData = async () => {
    try {
      // Fetch asset details to get the entity type
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('ownership_type')
        .eq('id', assetId)
        .single();

      if (assetError) throw assetError;

      // Fetch document requirements for this entity type
      const { data: reqs, error: reqError } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('entity_type', asset.ownership_type)
        .order('is_mandatory', { ascending: false });

      if (reqError) throw reqError;

      // Fetch existing documents
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('asset_id', assetId);

      if (docsError) throw docsError;

      setRequirements(reqs);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (requirement) => {
    const doc = documents.find(d => d.document_type === requirement.document_type);
    if (!doc) {
      return requirement.is_mandatory ? 'missing' : 'optional';
    }
    return doc.document_status || 'pending';
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Document Requirements</h3>
        
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {requirements.map((req) => {
              const status = getDocumentStatus(req);
              return (
                <li key={req.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {req.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {req.is_mandatory && (
                          <span className="ml-2 text-red-500">*</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{req.description}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full
                          ${status === 'approved' ? 'bg-green-100 text-green-800' :
                            status === 'rejected' ? 'bg-red-100 text-red-800' :
                            status === 'missing' ? 'bg-red-100 text-red-800' :
                            status === 'optional' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>
                  {req.risk_level && (
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full
                          ${req.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                            req.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'}`}
                      >
                        {req.risk_level.toUpperCase()} RISK
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default DocumentRequirements;
