import { supabase } from '../config/supabaseClient';

const EMAIL_TEMPLATES = {
  DOCUMENT_EXPIRING: {
    subject: 'Document Expiring Soon',
    body: (doc) => `
      Document "${doc.name}" for asset "${doc.asset.name}" is expiring on ${new Date(doc.expiry_date).toLocaleDateString()}.
      Please review and update this document before it expires.
      
      Document Details:
      - Type: ${doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      - Risk Level: ${doc.document_requirements?.risk_level || 'N/A'}
      - Status: ${doc.document_status}
      
      Click here to view the document: [URL]
    `
  },
  DOCUMENT_EXPIRED: {
    subject: 'Document Has Expired',
    body: (doc) => `
      Document "${doc.name}" for asset "${doc.asset.name}" has expired on ${new Date(doc.expiry_date).toLocaleDateString()}.
      Please update this document as soon as possible.
      
      Document Details:
      - Type: ${doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      - Risk Level: ${doc.document_requirements?.risk_level || 'N/A'}
      - Status: ${doc.document_status}
      
      Click here to view the document: [URL]
    `
  },
  DOCUMENT_UPDATED: {
    subject: 'Document Has Been Updated',
    body: (doc, changes) => `
      Document "${doc.name}" for asset "${doc.asset.name}" has been updated.
      
      Changes:
      ${Object.entries(changes)
        .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n')}
      
      Click here to view the document: [URL]
    `
  }
};

export const sendEmail = async (to, template, data) => {
  try {
    const emailTemplate = EMAIL_TEMPLATES[template];
    if (!emailTemplate) {
      throw new Error(`Email template ${template} not found`);
    }

    // In production, integrate with your email service provider
    // For now, we'll just log the email and store it in the database
    const { error } = await supabase
      .from('email_notifications')
      .insert({
        recipient_email: to,
        subject: emailTemplate.subject,
        body: emailTemplate.body(data),
        template_name: template,
        document_id: data.id,
        asset_id: data.asset_id,
        status: 'pending'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendExpiryNotifications = async () => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get documents expiring in the next 30 days
    const { data: expiringDocs, error: expiringError } = await supabase
      .from('documents')
      .select(`
        *,
        asset:assets (
          name,
          owner_email
        ),
        document_requirements (
          risk_level
        )
      `)
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', today.toISOString())
      .eq('document_status', 'approved');

    if (expiringError) throw expiringError;

    // Get expired documents
    const { data: expiredDocs, error: expiredError } = await supabase
      .from('documents')
      .select(`
        *,
        asset:assets (
          name,
          owner_email
        ),
        document_requirements (
          risk_level
        )
      `)
      .lt('expiry_date', today.toISOString())
      .eq('document_status', 'approved');

    if (expiredError) throw expiredError;

    // Send notifications for expiring documents
    for (const doc of expiringDocs || []) {
      if (doc.asset?.owner_email) {
        await sendEmail(
          doc.asset.owner_email,
          'DOCUMENT_EXPIRING',
          doc
        );
      }
    }

    // Send notifications for expired documents
    for (const doc of expiredDocs || []) {
      if (doc.asset?.owner_email) {
        await sendEmail(
          doc.asset.owner_email,
          'DOCUMENT_EXPIRED',
          doc
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending expiry notifications:', error);
    return false;
  }
};
