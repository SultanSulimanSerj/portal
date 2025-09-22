-- Enable RLS on key tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies table
CREATE POLICY companies_policy ON companies
  USING (id = current_setting('app.company_id')::uuid);

-- Create RLS policies for memberships table  
CREATE POLICY memberships_policy ON memberships
  USING (company_id = current_setting('app.company_id')::uuid);

-- Create RLS policies for invitations table
CREATE POLICY invitations_policy ON invitations
  USING (company_id = current_setting('app.company_id')::uuid);

-- Create RLS policies for audit_logs table
CREATE POLICY audit_logs_policy ON audit_logs
  USING (company_id = current_setting('app.company_id')::uuid);

-- Create RLS policies for notifications table
CREATE POLICY notifications_policy ON notifications
  USING (company_id = current_setting('app.company_id')::uuid);

-- Grant necessary permissions for RLS to work
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO PUBLIC;

-- Create function to set company context
CREATE OR REPLACE FUNCTION set_company_context(company_uuid uuid) 
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.company_id', company_uuid::text, false);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance with RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_id ON companies(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memberships_company_id ON memberships(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_company_id ON invitations(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create unique constraint for user-company membership
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_memberships_user_company_unique 
ON memberships(user_id, company_id);