-- Create enum for log types
CREATE TYPE system_log_action AS ENUM (
    -- Data modification actions
    'create',
    'update',
    'delete',
    -- User activity actions
    'view',
    'search',
    'login',
    'logout',
    'export',
    'download'
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Basic log information
    action_type system_log_action NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Entity information
    entity_type TEXT NOT NULL,  -- 'counterparty', 'asset', 'transaction', 'system' (for login/logout)
    entity_id TEXT,             -- NULL for login/logout/search actions
    entity_name TEXT,           -- Friendly name of the entity for easier reading
    
    -- User information
    user_email TEXT NOT NULL,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Detailed information
    details JSONB NOT NULL,     -- For updates: {changes: {field: {old, new}}}, For views: {tab, source}, For search: {query, filters}
    metadata JSONB,             -- Additional context (browser info, geo location, etc.)
    
    -- Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_system_logs_action_type ON system_logs(action_type);
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_user ON system_logs(user_email);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_details ON system_logs USING gin(details);
CREATE INDEX idx_system_logs_metadata ON system_logs USING gin(metadata);

-- Add RLS policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert logs"
ON system_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to allow authenticated users to view logs
CREATE POLICY "Allow authenticated users to view logs"
ON system_logs FOR SELECT
TO authenticated
USING (true);

-- Prevent updates and deletes on logs
CREATE POLICY "Prevent updates on logs"
ON system_logs FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent deletes on logs"
ON system_logs FOR DELETE
TO authenticated
USING (false);

-- Add comment to table
COMMENT ON TABLE system_logs IS 'Unified system logs for both audit trails and user activity tracking';

-- Create view for data changes only (audit logs)
CREATE VIEW audit_logs AS
SELECT * FROM system_logs
WHERE action_type IN ('create', 'update', 'delete');

-- Create view for user activity only
CREATE VIEW activity_logs AS
SELECT * FROM system_logs
WHERE action_type IN ('view', 'search', 'login', 'logout', 'export', 'download');
