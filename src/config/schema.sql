-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Document Types
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_level VARCHAR(50),
    required_for_entity_types VARCHAR(255)[], -- Array of entity types that require this document
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document_type_id UUID REFERENCES document_types(id),
    asset_id UUID NOT NULL, -- References assets
    entity_type VARCHAR(50) NOT NULL, -- 'asset', 'counterparty', 'transaction'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    comments TEXT,
    metadata JSONB
);

-- Document Access Log
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL, -- view, download, edit, delete
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Document Audit Logs
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Requirements
CREATE TABLE IF NOT EXISTS document_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50),
    is_mandatory BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default document requirements
INSERT INTO document_requirements (entity_type, document_type, risk_level, is_mandatory, description)
SELECT * FROM (VALUES
    ('company', 'certificate_of_incorporation', 'medium', true, 'Legal document confirming company registration'),
    ('company', 'ownership_structure', 'high', true, 'Document showing ownership hierarchy'),
    ('company', 'board_resolution', 'medium', false, 'Document showing board approval'),
    ('individual', 'passport', 'high', true, 'Government issued identification document'),
    ('individual', 'proof_of_address', 'medium', true, 'Document confirming physical address'),
    ('trust', 'trust_deed', 'high', true, 'Legal document establishing trust'),
    ('partnership', 'partnership_agreement', 'high', true, 'Legal document establishing partnership')
) AS v(entity_type, document_type, risk_level, is_mandatory, description)
WHERE NOT EXISTS (
    SELECT 1 FROM document_requirements 
    WHERE entity_type = v.entity_type 
    AND document_type = v.document_type
);

-- Add new columns to documents table
DO $$ 
BEGIN
    -- Add document_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'document_status'
    ) THEN
        ALTER TABLE documents ADD COLUMN document_status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- Add document_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'document_type'
    ) THEN
        ALTER TABLE documents ADD COLUMN document_type VARCHAR(50);
    END IF;

    -- Add metadata if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE documents ADD COLUMN metadata JSONB;
    END IF;

    -- Add expiry_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE documents ADD COLUMN expiry_date TIMESTAMPTZ;
    END IF;
END $$;

-- Add indexes (after columns are created)
DO $$ 
BEGIN
    -- Create document_status index if it doesn't exist and column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'document_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documents' AND indexname = 'idx_documents_status'
    ) THEN
        CREATE INDEX idx_documents_status ON documents(document_status);
    END IF;

    -- Create document_type index if it doesn't exist and column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'document_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documents' AND indexname = 'idx_documents_type'
    ) THEN
        CREATE INDEX idx_documents_type ON documents(document_type);
    END IF;

    -- Create asset_id index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documents' AND indexname = 'idx_documents_asset'
    ) THEN
        CREATE INDEX idx_documents_asset ON documents(asset_id);
    END IF;
END $$;

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_doc ON document_audit_logs(document_id);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

-- Document access policy
CREATE POLICY "Users can view documents they have access to" ON documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM assets a
            WHERE a.id = documents.asset_id
            AND (
                a.created_by = auth.uid() OR
                a.locked_by = auth.uid()
            )
        )
    );

-- Audit log access policy
CREATE POLICY "Users can view audit logs for their documents" ON document_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_audit_logs.document_id
            AND EXISTS (
                SELECT 1 FROM assets a
                WHERE a.id = d.asset_id
                AND (a.created_by = auth.uid() OR a.locked_by = auth.uid())
            )
        )
    );

-- Document requirements are viewable by all authenticated users
CREATE POLICY "Authenticated users can view document requirements" ON document_requirements
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Reference Data Tables
CREATE TABLE IF NOT EXISTS business_units (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS industries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sector TEXT,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS currencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Asset History Tracking
CREATE TABLE IF NOT EXISTS asset_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'status_change', 'compliance_update')),
  changes JSONB NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints to assets table
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS business_unit_id UUID REFERENCES business_units(id),
ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES industries(id),
ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES currencies(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_user_id ON asset_history(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_change_type ON asset_history(change_type);
CREATE INDEX IF NOT EXISTS idx_asset_history_created_at ON asset_history(created_at);
CREATE INDEX IF NOT EXISTS idx_asset_history_metadata ON asset_history USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_asset_history_changes ON asset_history USING GIN (changes);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_business_units_updated_at
  BEFORE UPDATE ON business_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industries_updated_at
  BEFORE UPDATE ON industries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to track asset history
CREATE OR REPLACE FUNCTION track_asset_history()
RETURNS TRIGGER AS $$
DECLARE
  changes_json JSONB;
  change_type TEXT;
  metadata_json JSONB;
BEGIN
  -- Get request metadata
  metadata_json := jsonb_build_object(
    'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
    'session_id', current_setting('request.jwt.claim.session_id', true),
    'timestamp', timezone('utc'::text, now())
  );

  IF TG_OP = 'INSERT' THEN
    change_type := 'created';
    changes_json := jsonb_build_object(
      'fields', to_jsonb(new),
      'related_entities', jsonb_build_object(
        'business_unit', (select name from business_units where id = new.business_unit_id),
        'industry', (select name from industries where id = new.industry_id)
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine change type and track specific changes
    IF new.status <> old.status THEN
      change_type := 'status_change';
      changes_json := jsonb_build_object(
        'previous_status', old.status,
        'new_status', new.status,
        'duration_in_previous_status', 
          extract(epoch from (now() - (
            select created_at 
            from asset_history 
            where asset_id = new.id 
            and change_type = 'status_change'
            order by created_at desc 
            limit 1
          )))
      );
    ELSIF new.compliance_status <> old.compliance_status THEN
      change_type := 'compliance_update';
      changes_json := jsonb_build_object(
        'previous_status', old.compliance_status,
        'new_status', new.compliance_status,
        'compliance_details', jsonb_build_object(
          'previous_risk_rating', old.risk_rating,
          'new_risk_rating', new.risk_rating,
          'previous_evaluation_date', old.evaluation_date,
          'new_evaluation_date', new.evaluation_date
        )
      );
    ELSE
      change_type := 'updated';
      changes_json := jsonb_build_object(
        'previous', to_jsonb(old),
        'new', to_jsonb(new),
        'changed_fields', (
          select jsonb_object_agg(key, value)
          from jsonb_each(to_jsonb(new))
          where to_jsonb(new)->key <> to_jsonb(old)->key
        )
      );
    END IF;
  ELSE
    change_type := 'deleted';
    changes_json := jsonb_build_object(
      'final_state', to_jsonb(old),
      'related_entities', jsonb_build_object(
        'business_unit', (select name from business_units where id = old.business_unit_id),
        'industry', (select name from industries where id = old.industry_id)
      )
    );
  END IF;

  -- Insert into asset_history with enhanced tracking
  INSERT INTO asset_history (
    asset_id,
    user_id,
    change_type,
    changes,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    change_type,
    changes_json,
    metadata_json,
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for asset history
CREATE TRIGGER track_asset_changes
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION track_asset_history();

-- Insert initial reference data
INSERT INTO currencies (code, name, symbol)
VALUES
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('SGD', 'Singapore Dollar', 'S$')
ON CONFLICT (code) DO NOTHING;

-- Create RLS policies
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to reference data for authenticated users"
  ON business_units FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow read access to reference data for authenticated users"
  ON industries FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow read access to reference data for authenticated users"
  ON currencies FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow read access to asset history for authenticated users"
  ON asset_history FOR SELECT
  TO authenticated
  USING (TRUE);
