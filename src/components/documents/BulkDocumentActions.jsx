import React, { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import Button from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';

const BulkDocumentActions = ({ selectedDocuments, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  const handleBulkStatusChange = async (newStatus) => {
    if (!selectedDocuments.length) return;

    try {
      setLoading(true);
      setError(null);

      // Update document statuses
      const { error: updateError } = await supabase
        .from('documents')
        .update({ document_status: newStatus })
        .in('id', selectedDocuments.map(d => d.id));

      if (updateError) throw updateError;

      // Create audit logs for each document
      const auditLogs = selectedDocuments.map(doc => ({
        document_id: doc.id,
        user_id: session.user.id,
        action: 'status_change',
        changes: {
          previous_status: doc.document_status,
          new_status: newStatus
        }
      }));

      const { error: auditError } = await supabase
        .from('document_audit_logs')
        .insert(auditLogs);

      if (auditError) throw auditError;

      onActionComplete?.();
    } catch (error) {
      console.error('Bulk status update error:', error);
      setError('Failed to update document statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (!selectedDocuments.length) return;

    try {
      setLoading(true);
      setError(null);

      // Download each document and create audit logs
      for (const doc of selectedDocuments) {
        try {
          const { data, error: downloadError } = await supabase.storage
            .from('documents')
            .download(doc.file_path);

          if (downloadError) throw downloadError;

          // Create audit log
          await supabase
            .from('document_audit_logs')
            .insert({
              document_id: doc.id,
              user_id: session.user.id,
              action: 'download',
              changes: { file_name: doc.name }
            });

          // Create download link
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.name;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error(`Error downloading document ${doc.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Bulk download error:', error);
      setError('Failed to download some documents');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedDocuments.length) return;

    try {
      setLoading(true);
      setError(null);

      // Archive documents
      const { error: updateError } = await supabase
        .from('documents')
        .update({ archived: true })
        .in('id', selectedDocuments.map(d => d.id));

      if (updateError) throw updateError;

      // Create audit logs
      const auditLogs = selectedDocuments.map(doc => ({
        document_id: doc.id,
        user_id: session.user.id,
        action: 'archive',
        changes: { archived: true }
      }));

      const { error: auditError } = await supabase
        .from('document_audit_logs')
        .insert(auditLogs);

      if (auditError) throw auditError;

      onActionComplete?.();
    } catch (error) {
      console.error('Bulk archive error:', error);
      setError('Failed to archive documents');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDocuments.length) {
    return null;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          {selectedDocuments.length} document(s) selected
        </h3>
        <button
          onClick={() => onActionComplete?.()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear selection
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="small"
          onClick={() => handleBulkStatusChange('approved')}
          disabled={loading}
        >
          Approve All
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => handleBulkStatusChange('rejected')}
          disabled={loading}
        >
          Reject All
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={handleBulkDownload}
          disabled={loading}
        >
          Download All
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={handleBulkArchive}
          disabled={loading}
        >
          Archive All
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Processing...</div>
      )}
    </div>
  );
};

export default BulkDocumentActions;
