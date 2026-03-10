-- Privacy Shadow Database Schema
-- PostgreSQL database for storing parent registrations, child devices, and alerts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Parents table: Stores parent account information
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  api_key VARCHAR(255) UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{
    "emailAlerts": true,
    "mobileAlerts": true,
    "alertThreshold": 50
  }'::jsonb,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children table: Stores child device information
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  birth_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table: Stores privacy alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  reasons JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  url TEXT,
  website VARCHAR(255),
  platform VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  sent_to_parent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table: Stores ML training feedback from parents
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  is_stranger BOOLEAN NOT NULL,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification deliveries: Tracks notification delivery status
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'push', 'sms')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training data table: Anonymized data for ML model training
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  features JSONB NOT NULL,
  label_is_stranger BOOLEAN,
  anonymized BOOLEAN DEFAULT TRUE,
  source_feedback_id UUID REFERENCES feedback(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_child_timestamp ON alerts(child_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_risk_level ON alerts(risk_level) WHERE NOT acknowledged;
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_device_id ON children(device_id);
CREATE INDEX IF NOT EXISTS idx_parents_api_key ON parents(api_key);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
CREATE INDEX IF NOT EXISTS idx_feedback_alert_id ON feedback(alert_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_alert_id ON notification_deliveries(alert_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_parent_id ON notification_deliveries(parent_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (remove in production)
-- INSERT INTO parents (email, api_key, verified) VALUES
-- ('test@example.com', 'test_api_key_123', true);

-- Views for common queries
CREATE OR REPLACE VIEW parent_alert_summary AS
SELECT
  p.id AS parent_id,
  p.email,
  COUNT(a.id) AS total_alerts,
  COUNT(*) FILTER (WHERE a.risk_level IN ('high', 'critical') AND NOT a.acknowledged) AS active_high_risk_alerts,
  MAX(a.created_at) AS last_alert_at
FROM parents p
LEFT JOIN children c ON c.parent_id = p.id
LEFT JOIN alerts a ON a.child_id = c.id
GROUP BY p.id, p.email;

-- Helper function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(255) AS $$
DECLARE
  api_key VARCHAR(255);
  exists BOOLEAN;
BEGIN
  LOOP
    api_key := 'ps_' || encode(gen_random_bytes(32), 'hex');
    SELECT EXISTS(SELECT 1 FROM parents WHERE api_key = api_key) INTO exists;
    IF NOT EXISTS THEN
      RETURN api_key;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
