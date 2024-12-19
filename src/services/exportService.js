import { supabase } from '../config/supabaseClient';
import Papa from 'papaparse';
import JSZip from 'jszip';

export const exportService = {
  async exportAssetData(assetId = null, options = {}) {
    try {
      // Prepare query
      let query = supabase.from('assets').select(`
        *,
        business_unit:business_units(name),
        industry:industries(name),
        currency:currencies(code),
        documents:documents(
          id,
          name,
          document_type,
          document_status,
          expiry_date,
          created_at
        ),
        compliance_analysis(
          evaluation_date,
          residual_risk_rating,
          inherent_risk_rating,
          summary_analysis
        )
      `);

      // Apply filters if assetId is provided
      if (assetId) {
        query = query.eq('id', assetId);
      }

      // Get data
      const { data, error } = await query;
      if (error) throw error;

      // Transform data for export
      const transformedData = data.map(asset => ({
        id: asset.id,
        name: asset.name,
        codename: asset.codename,
        business_unit: asset.business_unit?.name,
        industry: asset.industry?.name,
        ownership_type: asset.ownership_type,
        investment_type: asset.investment_type,
        status: asset.status,
        investment_amount: asset.investment_amount,
        currency: asset.currency?.code,
        investment_date: asset.investment_date,
        target_exit_date: asset.target_exit_date,
        documents_count: asset.documents?.length || 0,
        latest_compliance_rating: asset.compliance_analysis?.[0]?.residual_risk_rating || 'Not Rated',
        created_at: new Date(asset.created_at).toISOString(),
        updated_at: new Date(asset.updated_at).toISOString()
      }));

      // Convert to CSV
      const csv = Papa.unparse(transformedData);
      return { data: csv, format: 'csv' };
    } catch (error) {
      console.error('Error exporting asset data:', error);
      throw error;
    }
  },

  async exportAssetHistory(assetId, options = {}) {
    try {
      const { data, error } = await supabase
        .from('asset_history')
        .select(`
          *,
          user:users(email)
        `)
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform history data
      const transformedData = data.map(item => ({
        date: new Date(item.created_at).toISOString(),
        user: item.user?.email || 'System',
        change_type: item.change_type,
        details: this.formatHistoryChanges(item.changes, item.change_type),
        ip_address: item.ip_address,
        user_agent: item.user_agent
      }));

      // Convert to CSV
      const csv = Papa.unparse(transformedData);
      return { data: csv, format: 'csv' };
    } catch (error) {
      console.error('Error exporting asset history:', error);
      throw error;
    }
  },

  async exportDocuments(assetId, options = {}) {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          versions:document_versions(*)
        `)
        .eq('asset_id', assetId);

      if (error) throw error;

      // Create document metadata CSV
      const documentMetadata = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.document_type,
        status: doc.document_status,
        version: doc.current_version,
        versions_count: doc.versions?.length || 1,
        expiry_date: doc.expiry_date,
        created_at: new Date(doc.created_at).toISOString(),
        updated_at: new Date(doc.updated_at).toISOString()
      }));

      const metadataCsv = Papa.unparse(documentMetadata);

      // If files are requested, download them
      if (options.includeFiles) {
        const zip = new JSZip();
        
        // Add metadata CSV to zip
        zip.file('document_metadata.csv', metadataCsv);

        // Download and add each document
        for (const doc of documents) {
          try {
            const { data, error: downloadError } = await supabase.storage
              .from('documents')
              .download(doc.file_path);

            if (downloadError) throw downloadError;

            // Add to zip with folder structure
            const fileName = `documents/${doc.document_type}/${doc.name}`;
            zip.file(fileName, data);

            // Download versions if they exist
            if (doc.versions?.length > 0) {
              for (const version of doc.versions) {
                const { data: versionData, error: versionError } = await supabase.storage
                  .from('documents')
                  .download(version.file_path);

                if (versionError) throw versionError;

                const versionFileName = `documents/${doc.document_type}/versions/${doc.name}_v${version.version_number}`;
                zip.file(versionFileName, versionData);
              }
            }
          } catch (docError) {
            console.error(`Error downloading document ${doc.name}:`, docError);
          }
        }

        // Generate zip file
        const zipContent = await zip.generateAsync({ type: 'blob' });
        return { data: zipContent, format: 'zip' };
      }

      return { data: metadataCsv, format: 'csv' };
    } catch (error) {
      console.error('Error exporting documents:', error);
      throw error;
    }
  },

  async exportAll(assetId, options = {}) {
    try {
      const zip = new JSZip();

      // Export asset data
      const assetData = await this.exportAssetData(assetId);
      zip.file('asset_data.csv', assetData.data);

      // Export asset history
      const historyData = await this.exportAssetHistory(assetId);
      zip.file('asset_history.csv', historyData.data);

      // Export documents
      const documentData = await this.exportDocuments(assetId, { includeFiles: true });
      if (documentData.format === 'zip') {
        // Extract files from the document zip and add them to the main zip
        const docZip = await JSZip.loadAsync(documentData.data);
        for (const [path, file] of Object.entries(docZip.files)) {
          if (!file.dir) {
            const content = await file.async('blob');
            zip.file(path, content);
          }
        }
      } else {
        zip.file('documents.csv', documentData.data);
      }

      // Generate final zip file
      const zipContent = await zip.generateAsync({ type: 'blob' });
      return { data: zipContent, format: 'zip' };
    } catch (error) {
      console.error('Error exporting all data:', error);
      throw error;
    }
  },

  formatHistoryChanges(changes, changeType) {
    switch (changeType) {
      case 'created':
        return 'Asset created';
      case 'deleted':
        return 'Asset deleted';
      case 'status_change':
        return `Status changed from "${changes.previous_status}" to "${changes.new_status}"`;
      case 'compliance_update':
        return `Compliance status updated - Risk Rating: ${changes.compliance_details.new_risk_rating}`;
      case 'updated':
        const changedFields = Object.keys(changes.changed_fields || {});
        return `Updated fields: ${changedFields.join(', ')}`;
      default:
        return 'Unknown change';
    }
  },

  downloadFile(data, filename, format = 'csv') {
    const blob = new Blob([data], {
      type: format === 'csv'
        ? 'text/csv;charset=utf-8;'
        : 'application/zip'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default exportService;
