-- Islam Learning Platform Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase Dashboard → SQL Editor → New Query

-- Users
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  agreed_to_terms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (up to 5 per user)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2DD4BF',
  pin TEXT DEFAULT NULL,
  is_kids BOOLEAN DEFAULT false,
  enabled_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Preferences
CREATE TABLE onboarding_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profession TEXT DEFAULT '',
  family_role TEXT DEFAULT '',
  field TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scholars
CREATE TABLE scholars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  lectures INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics
CREATE TABLE topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'book',
  color TEXT DEFAULT '#2DD4BF',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content (lectures/videos)
CREATE TABLE content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  scholar_id UUID REFERENCES scholars(id),
  topic_id UUID REFERENCES topics(id),
  thumbnail TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  source_type TEXT DEFAULT 'youtube' CHECK (source_type IN ('youtube', 'external', 'uploaded')),
  source_url TEXT DEFAULT '',
  youtube_video_id TEXT DEFAULT '',
  rating NUMERIC(2,1) DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_new BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_kids_content BOOLEAN DEFAULT false,
  kids_category TEXT DEFAULT '',
  mood_tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover TEXT DEFAULT '',
  pages INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  description TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audiobooks
CREATE TABLE audiobooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  narrator TEXT NOT NULL,
  cover TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  rating NUMERIC(2,1) DEFAULT 0,
  source_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch History
CREATE TABLE watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, content_id)
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, content_id)
);

-- Gatherings
CREATE TABLE gatherings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_profile_id UUID REFERENCES profiles(id) NOT NULL,
  content_id UUID REFERENCES content(id) NOT NULL,
  max_participants INTEGER DEFAULT 5,
  is_live BOOLEAN DEFAULT true,
  current_timestamp_sec INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT true,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ DEFAULT NULL
);

-- Gathering Participants
CREATE TABLE gathering_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gathering_id UUID REFERENCES gatherings(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gathering_id, profile_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_content_scholar ON content(scholar_id);
CREATE INDEX idx_content_topic ON content(topic_id);
CREATE INDEX idx_content_trending ON content(is_trending);
CREATE INDEX idx_content_new ON content(is_new);
CREATE INDEX idx_watch_history_profile ON watch_history(profile_id, last_watched_at DESC);
CREATE INDEX idx_watchlist_profile ON watchlist(profile_id);
CREATE INDEX idx_gatherings_live ON gatherings(is_live);

-- Enable Row Level Security (optional, we handle auth in Express)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role access" ON users FOR ALL USING (true);
CREATE POLICY "Service role access" ON profiles FOR ALL USING (true);
