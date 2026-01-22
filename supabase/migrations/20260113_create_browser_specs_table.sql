-- =====================================================
-- Browser Specifications Table for Supabase
-- =====================================================
-- This table stores browser and device information for
-- visitors when they first enter the website.
-- =====================================================

-- Create the browser_specs table
CREATE TABLE IF NOT EXISTS browser_specs (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Visitor Identification
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Browser Information
  user_agent TEXT,
  browser_name TEXT,
  browser_version TEXT,

  -- Device Information
  platform TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  is_mobile BOOLEAN DEFAULT false,
  is_tablet BOOLEAN DEFAULT false,

  -- Screen Information
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  device_pixel_ratio DECIMAL(5, 2),
  color_depth INTEGER,

  -- Connection Information
  connection_type TEXT,
  effective_type TEXT,
  downlink DECIMAL(10, 2),

  -- Language & Timezone
  language TEXT,
  languages TEXT[],
  timezone TEXT,
  timezone_offset INTEGER,

  -- Hardware Information
  cpu_cores INTEGER,
  device_memory DECIMAL(10, 2),
  max_touch_points INTEGER DEFAULT 0,

  -- Feature Flags
  cookies_enabled BOOLEAN DEFAULT true,
  do_not_track BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT true,

  -- Referrer & Page Information
  referrer TEXT,
  page_url TEXT,
  page_title TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add an index for faster lookups
  CONSTRAINT browser_specs_visitor_id_key UNIQUE (visitor_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_browser_specs_user_id ON browser_specs(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_specs_created_at ON browser_specs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_browser_specs_device_type ON browser_specs(device_type);
CREATE INDEX IF NOT EXISTS idx_browser_specs_browser_name ON browser_specs(browser_name);

-- Enable Row Level Security (RLS)
ALTER TABLE browser_specs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for tracking visitors)
CREATE POLICY "Allow anonymous inserts"
  ON browser_specs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own data
CREATE POLICY "Users can view their own browser specs"
  ON browser_specs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow service role full access (for admin/analytics)
CREATE POLICY "Service role has full access"
  ON browser_specs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Optional: Create a view for analytics
-- =====================================================

CREATE OR REPLACE VIEW browser_specs_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) AS date,
  device_type,
  browser_name,
  COUNT(*) AS total_sessions,
  COUNT(DISTINCT user_id) AS logged_in_users,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS anonymous_sessions
FROM browser_specs
GROUP BY DATE_TRUNC('day', created_at), device_type, browser_name
ORDER BY date DESC;

-- Grant access to the analytics view
GRANT SELECT ON browser_specs_analytics TO authenticated;

-- =====================================================
-- Usage Notes:
-- =====================================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The table will automatically track visitors when they
--    enter the website
-- 3. Use the browser_specs_analytics view for quick insights
-- 4. Query examples:
--    
--    -- Get all visitors from today:
--    SELECT * FROM browser_specs 
--    WHERE created_at >= CURRENT_DATE;
--    
--    -- Get device type distribution:
--    SELECT device_type, COUNT(*) 
--    FROM browser_specs 
--    GROUP BY device_type;
--    
--    -- Get browser distribution:
--    SELECT browser_name, COUNT(*) 
--    FROM browser_specs 
--    GROUP BY browser_name 
--    ORDER BY COUNT(*) DESC;
-- =====================================================