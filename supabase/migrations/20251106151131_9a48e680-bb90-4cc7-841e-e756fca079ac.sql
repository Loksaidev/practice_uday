-- Create materialized view for player selections analytics
CREATE MATERIALIZED VIEW player_selections_analytics AS
SELECT 
  ps.id,
  ps.player_id,
  ps.room_id,
  ps.topic_id,
  ps.round,
  ps.ordered_items,
  ps.created_at,
  -- Denormalized player info
  p.name as player_name,
  p.user_id,
  p.organization_id,
  CASE WHEN p.user_id IS NOT NULL THEN true ELSE false END as is_auth_player,
  -- Denormalized room info
  gr.join_code,
  gr.host_name,
  gr.status as room_status,
  -- Topic information (handles both custom_topics and topics)
  COALESCE(ct.name, t.name) as topic_name,
  COALESCE(ct.category, t.category) as topic_category,
  CASE WHEN ct.id IS NOT NULL THEN true ELSE false END as is_custom_topic
FROM player_selections ps
INNER JOIN players p ON ps.player_id = p.id
LEFT JOIN game_rooms gr ON ps.room_id = gr.id
LEFT JOIN custom_topics ct ON ps.topic_id = ct.id
LEFT JOIN topics t ON ps.topic_id = t.id
WHERE p.is_ai = false;  -- Filter out AI players

-- Create indexes for common analytics queries
CREATE INDEX idx_player_selections_analytics_org_id 
  ON player_selections_analytics(organization_id);

CREATE INDEX idx_player_selections_analytics_created_at 
  ON player_selections_analytics(created_at);

CREATE INDEX idx_player_selections_analytics_topic_id 
  ON player_selections_analytics(topic_id);

CREATE INDEX idx_player_selections_analytics_org_created 
  ON player_selections_analytics(organization_id, created_at);

CREATE INDEX idx_player_selections_analytics_topic_category
  ON player_selections_analytics(topic_category);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_player_selections_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY player_selections_analytics;
END;
$$;

-- Function for org admins to query their organization's analytics
CREATE OR REPLACE FUNCTION get_org_player_selections_analytics(_org_id uuid)
RETURNS SETOF player_selections_analytics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is org admin for this organization
  IF NOT is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not authorized to view this organization analytics';
  END IF;
  
  RETURN QUERY
  SELECT * FROM player_selections_analytics
  WHERE organization_id = _org_id
  ORDER BY created_at DESC;
END;
$$;

-- Function for super admins to query all analytics
CREATE OR REPLACE FUNCTION get_all_player_selections_analytics(
  _limit integer DEFAULT 1000,
  _offset integer DEFAULT 0,
  _org_id uuid DEFAULT NULL,
  _start_date timestamp with time zone DEFAULT NULL,
  _end_date timestamp with time zone DEFAULT NULL
)
RETURNS SETOF player_selections_analytics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized to view all analytics';
  END IF;
  
  RETURN QUERY
  SELECT * FROM player_selections_analytics
  WHERE 
    (_org_id IS NULL OR organization_id = _org_id)
    AND (_start_date IS NULL OR created_at >= _start_date)
    AND (_end_date IS NULL OR created_at <= _end_date)
  ORDER BY created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;