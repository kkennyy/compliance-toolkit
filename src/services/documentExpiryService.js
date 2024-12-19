import { supabase } from '../config/supabaseClient';

export const checkDocumentExpiry = async () => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get documents expiring in the next 30 days
    const { data: expiringDocs, error } = await supabase
      .from('documents')
      .select(`
        *,
        asset:assets (
          name,
          codename
        )
      `)
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', today.toISOString())
      .eq('document_status', 'approved');

    if (error) throw error;
    return expiringDocs;
  } catch (error) {
    console.error('Error checking document expiry:', error);
    return [];
  }
};

export const getExpiredDocuments = async () => {
  try {
    const today = new Date();

    // Get expired documents
    const { data: expiredDocs, error } = await supabase
      .from('documents')
      .select(`
        *,
        asset:assets (
          name,
          codename
        )
      `)
      .lt('expiry_date', today.toISOString())
      .eq('document_status', 'approved');

    if (error) throw error;
    return expiredDocs;
  } catch (error) {
    console.error('Error getting expired documents:', error);
    return [];
  }
};

export const updateDocumentStatus = async (documentId, newStatus) => {
  try {
    const { error } = await supabase
      .from('documents')
      .update({ document_status: newStatus })
      .eq('id', documentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating document status:', error);
    return false;
  }
};
