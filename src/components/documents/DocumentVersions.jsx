import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Button from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';

const DocumentVersions = ({ documentId, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          uploaded_by:auth.users!uploaded_by (
            email
          )
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setError('Failed to load document versions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (version) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(version.file_path);

      if (error) throw error;

      // Log the download
      await supabase
        .from('document_audit_logs')
        .insert({
          document_id: documentId,
          user_id: session.user.id,
          action: 'version_download',
          changes: {
            version_number: version.version_number,
            file_name: version.file_name
          }
        });

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.file_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download version');
    }
  };

  const handleRestore = async (version) => {
    try {
      // Update the current document to point to this version
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          current_version: version.version_number,
          file_path: version.file_path,
          file_size: version.file_size,
          name: version.file_name
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Log the restore action
      await supabase
        .from('document_audit_logs')
        .insert({
          document_id: documentId,
          user_id: session.user.id,
          action: 'version_restore',
          changes: {
            version_number: version.version_number,
            file_name: version.file_name
          }
        });

      // Refresh versions
      await fetchVersions();
    } catch (error) {
      console.error('Restore error:', error);
      setError('Failed to restore version');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Document Versions</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="flow-root">
        <ul className="-my-5 divide-y divide-gray-200">
          {versions.map((version) => (
            <li key={version.id} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Version {version.version_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    {version.file_name}
                  </p>
                  <div className="mt-1 text-xs text-gray-500">
                    <div>
                      Size: {(version.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div>
                      Uploaded by: {version.uploaded_by?.email}
                    </div>
                    <div>
                      Upload date: {new Date(version.created_at).toLocaleString()}
                    </div>
                    {version.comment && (
                      <div className="mt-1">
                        Comment: {version.comment}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleDownload(version)}
                  >
                    Download
                  </Button>
                  {version.version_number !== versions[0]?.version_number && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleRestore(version)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DocumentVersions;
