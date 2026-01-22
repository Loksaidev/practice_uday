-- Add indexes for game_rooms table
CREATE INDEX IF NOT EXISTS idx_game_rooms_join_code ON game_rooms(join_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_organization_id ON game_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_current_vip_id ON game_rooms(current_vip_id);

-- Add indexes for players table
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_organization_id ON players(organization_id);
CREATE INDEX IF NOT EXISTS idx_players_room_is_host ON players(room_id, is_host);

-- Add indexes for player_selections table
CREATE INDEX IF NOT EXISTS idx_player_selections_room_id ON player_selections(room_id);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_id ON player_selections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_selections_round ON player_selections(round);
CREATE INDEX IF NOT EXISTS idx_player_selections_room_round ON player_selections(room_id, round);
CREATE INDEX IF NOT EXISTS idx_player_selections_player_round ON player_selections(player_id, round);

-- Add indexes for player_guesses table
CREATE INDEX IF NOT EXISTS idx_player_guesses_room_id ON player_guesses(room_id);
CREATE INDEX IF NOT EXISTS idx_player_guesses_player_id ON player_guesses(player_id);
CREATE INDEX IF NOT EXISTS idx_player_guesses_round ON player_guesses(round);
CREATE INDEX IF NOT EXISTS idx_player_guesses_vip_player_id ON player_guesses(vip_player_id);
CREATE INDEX IF NOT EXISTS idx_player_guesses_room_round ON player_guesses(room_id, round);
CREATE INDEX IF NOT EXISTS idx_player_guesses_player_round ON player_guesses(player_id, round);

-- Add indexes for custom_topics table
CREATE INDEX IF NOT EXISTS idx_custom_topics_organization_id ON custom_topics(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_topics_category ON custom_topics(category);

-- Add indexes for custom_topic_items table
CREATE INDEX IF NOT EXISTS idx_custom_topic_items_topic_id ON custom_topic_items(custom_topic_id);

-- Add indexes for topic_items table
CREATE INDEX IF NOT EXISTS idx_topic_items_topic_id ON topic_items(topic_id);

-- Add indexes for topics table
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);

-- Add indexes for organization_members table
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_role ON organization_members(user_id, role);

-- Add indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- Add indexes for organizations table
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Add indexes for game_history table
CREATE INDEX IF NOT EXISTS idx_game_history_join_code ON game_history(join_code);
CREATE INDEX IF NOT EXISTS idx_game_history_finished_at ON game_history(finished_at DESC);

-- Add indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);