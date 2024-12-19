-- Add any missing columns to documents table
DO $$ 
BEGIN
    -- Add metadata column if it doesn't exist
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

    -- Add status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'status'
    ) THEN
        ALTER TABLE documents ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Add any missing columns to document_versions table
DO $$ 
BEGIN
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_versions' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE document_versions ADD COLUMN metadata JSONB;
    END IF;

    -- Add comments if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_versions' AND column_name = 'comments'
    ) THEN
        ALTER TABLE document_versions ADD COLUMN comments TEXT;
    END IF;
END $$;

-- Add any missing columns to document_types table
DO $$ 
BEGIN
    -- Add risk_level if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_types' AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE document_types ADD COLUMN risk_level VARCHAR(50);
    END IF;

    -- Add required_for_entity_types if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_types' AND column_name = 'required_for_entity_types'
    ) THEN
        ALTER TABLE document_types ADD COLUMN required_for_entity_types VARCHAR(255)[];
    END IF;
END $$;

-- Insert default document types if they don't exist
INSERT INTO document_types (name, description, risk_level, required_for_entity_types)
SELECT * FROM (VALUES
    ('Certificate of Incorporation', 'Legal document confirming company registration', 'medium', ARRAY['company']),
    ('Passport', 'Government issued identification document', 'high', ARRAY['individual']),
    ('Proof of Address', 'Document confirming physical address', 'medium', ARRAY['individual', 'company']),
    ('Bank Statement', 'Recent bank statement for verification', 'high', ARRAY['individual', 'company']),
    ('Tax Registration', 'Tax registration documentation', 'medium', ARRAY['company']),
    ('Trust Deed', 'Legal document establishing trust', 'high', ARRAY['trust']),
    ('Partnership Agreement', 'Legal document establishing partnership', 'high', ARRAY['partnership']),
    ('Board Resolution', 'Document showing board approval', 'medium', ARRAY['company']),
    ('Regulatory License', 'Regulatory approval documentation', 'high', ARRAY['company']),
    ('Ownership Structure', 'Document showing ownership hierarchy', 'high', ARRAY['company', 'trust', 'partnership'])
) AS v(name, description, risk_level, required_for_entity_types)
WHERE NOT EXISTS (
    SELECT 1 FROM document_types WHERE name = v.name
);
