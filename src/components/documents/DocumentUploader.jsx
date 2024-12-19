import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Button from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';

const DocumentUploader = ({ assetId, existingDocumentId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [comment, setComment] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  useEffect(() => {
    if (existingDocumentId) {
      fetchExistingDocument();
    }
    fetchRequirements();
  }, [assetId, existingDocumentId]);

  const fetchExistingDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', existingDocumentId)
        .single();

      if (error) throw error;
      
      setDocumentType(data.document_type);
      if (data.expiry_date) {
        setExpiryDate(data.expiry_date.split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const fetchRequirements = async () => {
    try {
      // Get asset type first
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('ownership_type')
        .eq('id', assetId)
        .single();

      if (assetError) throw assetError;

      // Get requirements for this asset type
      const { data, error } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('entity_type', asset.ownership_type)
        .order('is_mandatory', { ascending: false });

      if (error) throw error;
      setRequirements(data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      setError('Failed to load document types');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      setError('Please select a file and document type');
      return;
    }

    const requirement = requirements.find(r => r.document_type === documentType);
    if (requirement?.is_mandatory && !expiryDate) {
      setError('Expiry date is required for this document type');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      let newVersionNumber = 1;
      if (existingDocumentId) {
        // Get the latest version number
        const { data: versions, error: versionError } = await supabase
          .from('document_versions')
          .select('version_number')
          .eq('document_id', existingDocumentId)
          .order('version_number', { ascending: false })
          .limit(1);

        if (versionError) throw versionError;
        if (versions?.length > 0) {
          newVersionNumber = versions[0].version_number + 1;
        }
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetId}/${documentType}_v${newVersionNumber}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      if (existingDocumentId) {
        // Create new version
        const { error: versionError } = await supabase
          .from('document_versions')
          .insert({
            document_id: existingDocumentId,
            version_number: newVersionNumber,
            file_path: fileName,
            file_name: file.name,
            file_size: file.size,
            uploaded_by: session.user.id,
            comment: comment || null
          });

        if (versionError) throw versionError;

        // Update document record
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            file_path: fileName,
            file_size: file.size,
            current_version: newVersionNumber,
            expiry_date: expiryDate || null,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingDocumentId);

        if (updateError) throw updateError;

        // Create audit log
        await supabase
          .from('document_audit_logs')
          .insert({
            document_id: existingDocumentId,
            user_id: session.user.id,
            action: 'version_upload',
            changes: {
              version_number: newVersionNumber,
              file_name: file.name,
              comment: comment || null
            }
          });
      } else {
        // Create new document record
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert({
            asset_id: assetId,
            name: file.name,
            document_type: documentType,
            file_path: fileName,
            file_size: file.size,
            expiry_date: expiryDate || null,
            uploaded_by: session.user.id,
            document_status: 'pending',
            current_version: 1
          })
          .select()
          .single();

        if (docError) throw docError;

        // Create first version
        const { error: versionError } = await supabase
          .from('document_versions')
          .insert({
            document_id: document.id,
            version_number: 1,
            file_path: fileName,
            file_name: file.name,
            file_size: file.size,
            uploaded_by: session.user.id,
            comment: comment || null
          });

        if (versionError) throw versionError;

        // Create audit log
        await supabase
          .from('document_audit_logs')
          .insert({
            document_id: document.id,
            user_id: session.user.id,
            action: 'upload',
            changes: {
              file_name: file.name,
              document_type: documentType,
              expiry_date: expiryDate
            }
          });
      }

      onUploadComplete?.();
      setFile(null);
      setDocumentType('');
      setExpiryDate('');
      setComment('');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!existingDocumentId && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={existingDocumentId}
          >
            <option value="">Select a document type</option>
            {requirements.map((req) => (
              <option key={req.id} value={req.document_type}>
                {req.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {req.is_mandatory ? ' *' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {documentType && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date
            {requirements.find(r => r.document_type === documentType)?.is_mandatory && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          File
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {existingDocumentId && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Version Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe what changed in this version..."
          />
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {documentType && (
        <div className="text-sm text-gray-500">
          {requirements.find(r => r.document_type === documentType)?.description}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!file || !documentType || uploading}
        >
          {uploading ? 'Uploading...' : existingDocumentId ? 'Upload New Version' : 'Upload'}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploader;
