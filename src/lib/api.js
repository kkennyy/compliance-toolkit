import { supabase } from './supabase'

// Asset APIs
export async function getAssetById(id) {
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      compliance_evaluations (
        *,
        compliance_topics (
          *
        )
      ),
      counterparties (*),
      personnel (*),
      documents (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Compliance APIs
export async function updateComplianceEvaluation(evaluationId, updates) {
  const { data: evaluation, error: evaluationError } = await supabase
    .from('compliance_evaluations')
    .update({
      overall_residual_risk: updates.overallResidualRisk,
      overall_inherent_risk: updates.overallInherentRisk,
      summary: updates.summary,
      methodology: updates.methodology,
      updated_at: new Date().toISOString(),
      updated_by: supabase.auth.user()?.id
    })
    .eq('id', evaluationId)
    .select()
    .single()

  if (evaluationError) throw evaluationError

  // Update topics
  const { error: topicsError } = await supabase
    .from('compliance_topics')
    .upsert(
      updates.topics.map(topic => ({
        evaluation_id: evaluationId,
        topic: topic.topic,
        risk_rating: topic.rating,
        analysis: topic.analysis,
        updated_at: new Date().toISOString(),
        updated_by: supabase.auth.user()?.id
      }))
    )

  if (topicsError) throw topicsError

  // Create audit trail entry
  const { error: auditError } = await supabase
    .from('audit_trail')
    .insert({
      entity_type: 'compliance_evaluation',
      entity_id: evaluationId,
      action: 'update',
      changes: updates,
      performed_by: supabase.auth.user()?.id,
      performed_at: new Date().toISOString()
    })

  if (auditError) throw auditError

  return evaluation
}

// Document APIs
export async function uploadDocument(assetId, file, metadata) {
  // Upload file to storage
  const filename = `${assetId}/${Date.now()}-${file.name}`
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('documents')
    .upload(filename, file)

  if (fileError) throw fileError

  // Create document record
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert({
      asset_id: assetId,
      filename: file.name,
      storage_path: filename,
      description: metadata.description,
      document_type: metadata.type,
      uploaded_by: supabase.auth.user()?.id,
      uploaded_at: new Date().toISOString()
    })
    .select()
    .single()

  if (documentError) throw documentError

  // Create audit trail entry
  const { error: auditError } = await supabase
    .from('audit_trail')
    .insert({
      entity_type: 'document',
      entity_id: document.id,
      action: 'create',
      changes: metadata,
      performed_by: supabase.auth.user()?.id,
      performed_at: new Date().toISOString()
    })

  if (auditError) throw auditError

  return document
}
