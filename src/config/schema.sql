-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies and triggers
DO $$ 
DECLARE
    pol record;
    trg record;
BEGIN
    -- Drop policies
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;

    -- Drop non-system triggers
    FOR trg IN (
        SELECT tgname, relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relnamespace = 'public'::regnamespace
        AND NOT tgname LIKE 'RI_ConstraintTrigger_%'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trg.tgname, trg.relname);
    END LOOP;
END $$;

-- Reference Data Tables
CREATE TABLE IF NOT EXISTS business_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sector TEXT,
    risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Core Tables
CREATE TABLE IF NOT EXISTS personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'ORP Personnel',
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    codename VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'Pending',
    business_unit_id UUID REFERENCES business_units(id),
    industry_id UUID REFERENCES industries(id),
    currency_id UUID REFERENCES currencies(id),
    ownership_type VARCHAR(50),
    investment_type VARCHAR(50),
    investment_amount DECIMAL(18,2),
    investment_date DATE,
    target_exit_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    can_view BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(asset_id, user_id)
);

CREATE TABLE IF NOT EXISTS counterparties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS controllers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counterparty_controllers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counterparty_id UUID REFERENCES counterparties(id),
    controller_id UUID REFERENCES controllers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(counterparty_id, controller_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    codename VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    asset_id UUID REFERENCES assets(id),
    counterparty_id UUID REFERENCES counterparties(id),
    interest_concerned DECIMAL(5,2),
    interest_amount DECIMAL(18,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_compliance_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    evaluation_date TIMESTAMPTZ NOT NULL,
    residual_risk_rating VARCHAR(50),
    inherent_risk_rating VARCHAR(50),
    summary_analysis TEXT,
    methodology TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Management Tables
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_level VARCHAR(50),
    required_for_entity_types VARCHAR(255)[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document_type_id UUID REFERENCES document_types(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    entity_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB,
    expiry_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    metadata JSONB,
    comments TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    upload_date TIMESTAMPTZ DEFAULT NOW()
);

-- Asset History Tracking
CREATE TABLE IF NOT EXISTS asset_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'status_change', 'compliance_update')),
    changes JSONB NOT NULL,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_user_id ON asset_history(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_change_type ON asset_history(change_type);
CREATE INDEX IF NOT EXISTS idx_asset_history_created_at ON asset_history(created_at);
CREATE INDEX IF NOT EXISTS idx_asset_history_metadata ON asset_history USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_asset_history_changes ON asset_history USING GIN (changes);

CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_counterparty ON transactions(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_counterparty_controllers_counterparty ON counterparty_controllers(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_counterparty_controllers_controller ON counterparty_controllers(controller_id);
CREATE INDEX IF NOT EXISTS idx_transaction_compliance ON transaction_compliance_analysis(transaction_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_asset_history()
RETURNS TRIGGER AS $$
DECLARE
    changes_json jsonb;
    change_type text;
    metadata_json jsonb;
BEGIN
    -- Get request metadata
    metadata_json := jsonb_build_object(
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
        'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
        'session_id', current_setting('request.jwt.claim.session_id', true),
        'timestamp', NOW()
    );

    IF TG_OP = 'INSERT' THEN
        change_type := 'created';
        changes_json := jsonb_build_object(
            'fields', to_jsonb(NEW),
            'related_entities', jsonb_build_object(
                'business_unit', (SELECT name FROM business_units WHERE id = NEW.business_unit_id),
                'industry', (SELECT name FROM industries WHERE id = NEW.industry_id)
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            change_type := 'status_change';
            changes_json := jsonb_build_object(
                'previous_status', OLD.status,
                'new_status', NEW.status
            );
        ELSE
            change_type := 'updated';
            changes_json := jsonb_build_object(
                'previous', to_jsonb(OLD),
                'new', to_jsonb(NEW),
                'changed_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
                )
            );
        END IF;
    ELSE
        change_type := 'deleted';
        changes_json := jsonb_build_object(
            'final_state', to_jsonb(OLD)
        );
    END IF;

    -- Insert into asset_history
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

-- Triggers
DO $$ 
BEGIN
    -- Create asset history trigger
    DROP TRIGGER IF EXISTS track_asset_changes ON assets;
    CREATE TRIGGER track_asset_changes
        AFTER INSERT OR UPDATE OR DELETE ON assets
        FOR EACH ROW
        EXECUTE FUNCTION track_asset_history();

    -- Create updated_at triggers
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON personnel
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON assets
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON counterparties
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON transaction_compliance_analysis
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON business_units
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON industries
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_updated_at_column
        BEFORE UPDATE ON currencies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Enable Row Level Security
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE controllers ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparty_controllers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_compliance_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON controllers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON counterparties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON counterparty_controllers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON transaction_compliance_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON business_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON industries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON currencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view assets they have access to" ON assets FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM asset_access aa
    WHERE aa.asset_id = id
    AND aa.user_id = auth.uid()
    AND aa.can_view = true
));

CREATE POLICY "Users can view their own access" ON asset_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own access" ON asset_access FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view documents they have access to" ON documents FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM assets a
    WHERE a.id = documents.asset_id
    AND EXISTS (
        SELECT 1 FROM asset_access aa
        WHERE aa.asset_id = a.id
        AND aa.user_id = auth.uid()
    )
));

-- Insert Initial Reference Data
INSERT INTO business_units (name, description, active) VALUES
    ('Corporate Finance', 'Corporate Finance and Investment Division', true),
    ('Asset Management', 'Asset Management and Portfolio Services', true),
    ('Private Equity', 'Private Equity Investments', true),
    ('Real Estate', 'Real Estate Investment and Development', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO industries (name, description, sector, risk_level, active) VALUES
    ('Technology', 'Software and Technology Services', 'Information Technology', 'Medium', true),
    ('Healthcare', 'Healthcare Services and Equipment', 'Healthcare', 'Low', true),
    ('Real Estate', 'Commercial and Residential Properties', 'Real Estate', 'Medium', true),
    ('Financial Services', 'Banking and Financial Services', 'Finance', 'High', true),
    ('Manufacturing', 'Industrial Manufacturing', 'Industrial', 'Medium', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO currencies (code, name, symbol, active) VALUES
    ('USD', 'US Dollar', '$', true),
    ('EUR', 'Euro', '€', true),
    ('GBP', 'British Pound', '£', true),
    ('SGD', 'Singapore Dollar', 'S$', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO document_types (name, description, risk_level, required_for_entity_types) VALUES
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
ON CONFLICT (name) DO NOTHING;
