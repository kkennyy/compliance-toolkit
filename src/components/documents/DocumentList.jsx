import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Table from '../shared/Table';
import Button from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';
import DocumentHistory from './DocumentHistory';
import DocumentRequirements from './DocumentRequirements';
import DocumentVersions from './DocumentVersions';
import BulkDocumentActions from './BulkDocumentActions';
import * as Dialog from '@radix-ui/react-dialog';

const DocumentList = ({ assetId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [viewMode, setViewMode] = useState(null); // 'history' or 'versions'
  const { session } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, [assetId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_requirements (
            risk_level,
            description,
            is_mandatory
          ),
          versions:document_versions (
            version_number
          )
        `)
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Log the download
      await supabase
        .from('document_audit_logs')
        .insert({
          document_id: document.id,
          user_id: session.user.id,
          action: 'download',
          changes: { file_name: document.name }
        });

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleStatusChange = async (document, newStatus) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ document_status: newStatus })
        .eq('id', document.id);

      if (error) throw error;

      // Log the status change
      await supabase
        .from('document_audit_logs')
        .insert({
          document_id: document.id,
          user_id: session.user.id,
          action: 'status_change',
          changes: {
            previous_status: document.document_status,
            new_status: newStatus
          }
        });

      fetchDocuments();
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleDocumentSelect = (document, selected) => {
    if (selected) {
      setSelectedDocuments([...selectedDocuments, document]);
    } else {
      setSelectedDocuments(selectedDocuments.filter(d => d.id !== document.id));
    }
  };

  const handleBulkActionComplete = () => {
    setSelectedDocuments([]);
    fetchDocuments();
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedDocuments.length === documents.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedDocuments(documents);
            } else {
              setSelectedDocuments([]);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedDocuments.some(d => d.id === row.id)}
          onChange={(e) => handleDocumentSelect(row, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    { 
      key: 'name', 
      label: 'Document Name',
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">
            Type: {row.document_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {row.document_requirements?.is_mandatory && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Version {row.current_version} of {row.versions?.length || 1}
          </div>
        </div>
      )
    },
    {
      key: 'document_status',
      label: 'Status',
      render: (row) => (
        <select
          value={row.document_status || 'pending'}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          className={`px-2 py-1 text-xs font-semibold rounded-full
            ${row.document_status === 'approved' ? 'bg-green-100 text-green-800' :
              row.document_status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'}`}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      )
    },
    {
      key: 'risk_level',
      label: 'Risk Level',
      render: (row) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
          ${row.document_requirements?.risk_level === 'high' ? 'bg-red-100 text-red-800' :
            row.document_requirements?.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'}`}
        >
          {row.document_requirements?.risk_level || 'N/A'}
        </span>
      )
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      render: (row) => {
        if (!row.expiry_date) return 'No expiry';
        const daysUntilExpiry = Math.ceil(
          (new Date(row.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return (
          <div>
            <div>{new Date(row.expiry_date).toLocaleDateString()}</div>
            {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
              <div className="text-yellow-600 text-xs">
                Expires in {daysUntilExpiry} days
              </div>
            )}
            {daysUntilExpiry <= 0 && (
              <div className="text-red-600 text-xs">
                Expired
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Upload Date',
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleDownload(row)}
          >
            Download
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setSelectedDocument(row);
              setViewMode('history');
            }}
          >
            History
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setSelectedDocument(row);
              setViewMode('versions');
            }}
          >
            Versions
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DocumentRequirements assetId={assetId} />

      {selectedDocuments.length > 0 && (
        <BulkDocumentActions
          selectedDocuments={selectedDocuments}
          onActionComplete={handleBulkActionComplete}
        />
      )}

      <div className="space-y-4">
        <Table
          data={documents}
          columns={columns}
          loading={loading}
          emptyMessage="No documents found"
        />

        <Dialog.Root
          open={!!selectedDocument}
          onOpenChange={() => {
            setSelectedDocument(null);
            setViewMode(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg overflow-y-auto">
              {selectedDocument && viewMode === 'history' && (
                <DocumentHistory
                  documentId={selectedDocument.id}
                  onClose={() => {
                    setSelectedDocument(null);
                    setViewMode(null);
                  }}
                />
              )}
              {selectedDocument && viewMode === 'versions' && (
                <DocumentVersions
                  documentId={selectedDocument.id}
                  onClose={() => {
                    setSelectedDocument(null);
                    setViewMode(null);
                  }}
                />
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default DocumentList;
