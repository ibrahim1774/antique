-- Run this in your Supabase SQL editor to set up the schema.

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  google_id TEXT UNIQUE,
  scan_count INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  item_name TEXT,
  category TEXT,
  era TEXT,
  origin TEXT,
  confidence TEXT,
  historical_context TEXT,
  makers_mark TEXT,
  search_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scans_user_id_idx
  ON scans(user_id);

CREATE INDEX IF NOT EXISTS scans_created_at_idx
  ON scans(created_at DESC);
