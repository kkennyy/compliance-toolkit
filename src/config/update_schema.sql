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

-- Drop existing policies
do $$ 
declare
  pol record;
begin
  for pol in (
    select policyname, tablename 
    from pg_policies 
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Create asset access table first
create table if not exists asset_access (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references assets(id) on delete cascade,
  user_id uuid references auth.users(id),
  can_view boolean default true,
  can_edit boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(asset_id, user_id)
);

-- Add indexes for asset_access
create index if not exists idx_asset_access_asset_id on asset_access(asset_id);
create index if not exists idx_asset_access_user_id on asset_access(user_id);

-- Enable RLS on asset_access
alter table asset_access enable row level security;

-- Create policies for asset_access
CREATE POLICY "Users can view their own access"
  ON asset_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create initial access"
  ON asset_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Asset editors can manage access"
  ON asset_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asset_access aa
      WHERE aa.asset_id = asset_access.asset_id
      AND aa.user_id = auth.uid()
      AND aa.can_edit = true
    )
  );

-- Grant all users access to their own assets by default
insert into asset_access (asset_id, user_id, can_view, can_edit)
select id, auth.uid(), true, true
from assets
where not exists (
  select 1 from asset_access
  where asset_access.asset_id = assets.id
  and asset_access.user_id = auth.uid()
);

-- Reference Data Tables
create table if not exists business_units (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists industries (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  sector text,
  risk_level text check (risk_level in ('Low', 'Medium', 'High')),
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists currencies (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  name text not null,
  symbol text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Asset History Tracking
create table if not exists asset_history (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references assets(id) on delete cascade,
  user_id uuid references auth.users(id),
  change_type text not null check (change_type in ('created', 'updated', 'deleted', 'status_change', 'compliance_update')),
  changes jsonb not null,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key constraints to assets table if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'assets' and column_name = 'business_unit_id') then
    alter table assets add column business_unit_id uuid references business_units(id);
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'assets' and column_name = 'industry_id') then
    alter table assets add column industry_id uuid references industries(id);
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'assets' and column_name = 'currency_id') then
    alter table assets add column currency_id uuid references currencies(id);
  end if;
end $$;

-- Create indexes
create index if not exists idx_asset_history_asset_id on asset_history(asset_id);
create index if not exists idx_asset_history_user_id on asset_history(user_id);
create index if not exists idx_asset_history_change_type on asset_history(change_type);
create index if not exists idx_asset_history_created_at on asset_history(created_at);
create index if not exists idx_asset_history_metadata on asset_history using gin (metadata);
create index if not exists idx_asset_history_changes on asset_history using gin (changes);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
drop trigger if exists update_business_units_updated_at on business_units;
create trigger update_business_units_updated_at
  before update on business_units
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_industries_updated_at on industries;
create trigger update_industries_updated_at
  before update on industries
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_currencies_updated_at on currencies;
create trigger update_currencies_updated_at
  before update on currencies
  for each row
  execute function update_updated_at_column();

-- Create function to track asset history
create or replace function track_asset_history()
returns trigger as $$
declare
  changes_json jsonb;
  change_type text;
  metadata_json jsonb;
begin
  -- Get request metadata
  metadata_json := jsonb_build_object(
    'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
    'session_id', current_setting('request.jwt.claim.session_id', true),
    'timestamp', timezone('utc'::text, now())
  );

  if TG_OP = 'INSERT' then
    change_type := 'created';
    changes_json := jsonb_build_object(
      'fields', to_jsonb(new),
      'related_entities', jsonb_build_object(
        'business_unit', (select name from business_units where id = new.business_unit_id),
        'industry', (select name from industries where id = new.industry_id)
      )
    );
  elsif TG_OP = 'UPDATE' then
    -- Determine change type and track specific changes
    if new.status <> old.status then
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
    elsif new.compliance_status <> old.compliance_status then
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
    else
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
    end if;
  else
    change_type := 'deleted';
    changes_json := jsonb_build_object(
      'final_state', to_jsonb(old),
      'related_entities', jsonb_build_object(
        'business_unit', (select name from business_units where id = old.business_unit_id),
        'industry', (select name from industries where id = old.industry_id)
      )
    );
  end if;

  -- Insert into asset_history with enhanced tracking
  insert into asset_history (
    asset_id,
    user_id,
    change_type,
    changes,
    metadata,
    ip_address,
    user_agent
  ) values (
    coalesce(new.id, old.id),
    auth.uid(),
    change_type,
    changes_json,
    metadata_json,
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Create triggers for asset history
drop trigger if exists track_asset_changes on assets;
create trigger track_asset_changes
  after insert or update or delete on assets
  for each row
  execute function track_asset_history();

-- Insert initial reference data
INSERT INTO business_units (name, description, active)
VALUES
  ('Corporate Finance', 'Corporate Finance and Investment Division', true),
  ('Asset Management', 'Asset Management and Portfolio Services', true),
  ('Private Equity', 'Private Equity Investments', true),
  ('Real Estate', 'Real Estate Investment and Development', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO industries (name, description, sector, risk_level, active)
VALUES
  ('Technology', 'Software and Technology Services', 'Information Technology', 'Medium', true),
  ('Healthcare', 'Healthcare Services and Equipment', 'Healthcare', 'Low', true),
  ('Real Estate', 'Commercial and Residential Properties', 'Real Estate', 'Medium', true),
  ('Financial Services', 'Banking and Financial Services', 'Finance', 'High', true),
  ('Manufacturing', 'Industrial Manufacturing', 'Industrial', 'Medium', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO currencies (code, name, symbol, active)
VALUES
  ('USD', 'US Dollar', '$', true),
  ('EUR', 'Euro', '€', true),
  ('GBP', 'British Pound', '£', true),
  ('SGD', 'Singapore Dollar', 'S$', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO assets (
  name, 
  codename, 
  business_unit_id,
  industry_id,
  currency_id,
  ownership_type,
  investment_type,
  status,
  investment_amount,
  investment_date,
  target_exit_date
)
SELECT 
  'Tech Innovators Ltd',
  'Project Alpha',
  (SELECT id FROM business_units WHERE name = 'Private Equity'),
  (SELECT id FROM industries WHERE name = 'Technology'),
  (SELECT id FROM currencies WHERE code = 'USD'),
  'Direct',
  'Growth Equity',
  'Active',
  5000000,
  '2023-01-15',
  '2026-01-15'
WHERE NOT EXISTS (
  SELECT 1 FROM assets WHERE codename = 'Project Alpha'
);

INSERT INTO asset_access (asset_id, user_id, can_view, can_edit)
SELECT a.id, auth.uid(), true, true
FROM assets a
WHERE NOT EXISTS (
  SELECT 1 FROM asset_access aa
  WHERE aa.asset_id = a.id
  AND aa.user_id = auth.uid()
);

-- Enable RLS on all tables
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg(
            format('DROP POLICY IF EXISTS %I ON %I', 
                   pol.policyname, 
                   pol.tablename),
            '; ')
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
    );
END $$;

-- Create RLS policies for reference data
CREATE POLICY "Allow authenticated users to read business units"
  ON business_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read industries"
  ON industries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read currencies"
  ON currencies FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policies for asset_access
CREATE POLICY "Users can view their own access"
  ON asset_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create initial access"
  ON asset_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Asset editors can manage access"
  ON asset_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asset_access aa
      WHERE aa.asset_id = asset_access.asset_id
      AND aa.user_id = auth.uid()
      AND aa.can_edit = true
    )
  );

-- Create RLS policies for assets
CREATE POLICY "Users can view assets they have access to"
  ON assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asset_access aa
      WHERE aa.asset_id = id
      AND aa.user_id = auth.uid()
      AND aa.can_view = true
    )
  );

CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can edit assets they have edit access to"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asset_access aa
      WHERE aa.asset_id = id
      AND aa.user_id = auth.uid()
      AND aa.can_edit = true
    )
  );

CREATE POLICY "Users can delete assets they have edit access to"
  ON assets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asset_access aa
      WHERE aa.asset_id = id
      AND aa.user_id = auth.uid()
      AND aa.can_edit = true
    )
  );

-- Add unique constraint for codename if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_codename'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT unique_codename UNIQUE (codename);
    END IF;
END$$;

-- Re-create document policies with correct access control
CREATE POLICY "Users can view documents they have access to"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = documents.asset_id
      AND EXISTS (
        SELECT 1 FROM asset_access aa
        WHERE aa.asset_id = a.id
        AND aa.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert documents for assets they have access to"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = documents.asset_id
      AND EXISTS (
        SELECT 1 FROM asset_access aa
        WHERE aa.asset_id = a.id
        AND aa.user_id = auth.uid()
        AND aa.can_edit = true
      )
    )
  );

-- Create function to handle atomic asset creation with access
CREATE OR REPLACE FUNCTION create_asset_with_access(
  asset_data JSONB,
  user_id UUID
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_asset assets;
BEGIN
  -- Create the asset
  INSERT INTO assets (
    name,
    codename,
    business_unit_id,
    industry_id,
    currency_id,
    ownership_type,
    investment_type,
    status,
    investment_amount,
    investment_date,
    target_exit_date
  )
  VALUES (
    asset_data->>'name',
    asset_data->>'codename',
    (asset_data->>'business_unit_id')::uuid,
    (asset_data->>'industry_id')::uuid,
    (asset_data->>'currency_id')::uuid,
    asset_data->>'ownership_type',
    asset_data->>'investment_type',
    asset_data->>'status',
    (asset_data->>'investment_amount')::decimal,
    (asset_data->>'investment_date')::date,
    (asset_data->>'target_exit_date')::date
  )
  RETURNING * INTO new_asset;

  -- Grant access to the creator
  INSERT INTO asset_access (
    asset_id,
    user_id,
    can_view,
    can_edit
  ) VALUES (
    new_asset.id,
    user_id,
    true,
    true
  );

  RETURN jsonb_build_object(
    'id', new_asset.id,
    'name', new_asset.name,
    'status', new_asset.status
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_asset_with_access TO authenticated;
