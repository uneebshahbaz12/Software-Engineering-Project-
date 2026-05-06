-- Create content_views table for tracking unique views per profile
-- Each profile can only count as ONE view per content item
CREATE TABLE IF NOT EXISTS content_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, content_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_content_views_profile_content 
  ON content_views(profile_id, content_id);

CREATE INDEX IF NOT EXISTS idx_content_views_content 
  ON content_views(content_id);
