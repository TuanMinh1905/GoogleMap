-- ============================================
-- GG Map - Database Schema
-- Chạy SQL này trong Supabase SQL Editor
-- ============================================

-- Bật UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng markers
CREATE TABLE IF NOT EXISTS markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  note TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'whenever')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index để query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_markers_city ON markers(city);
CREATE INDEX IF NOT EXISTS idx_markers_priority ON markers(priority);
CREATE INDEX IF NOT EXISTS idx_markers_created_at ON markers(created_at DESC);

-- Bật Row Level Security
ALTER TABLE markers ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả thao tác (vì đã có PIN auth ở client)
CREATE POLICY "Cho phép tất cả thao tác" ON markers
  FOR ALL
  USING (true)
  WITH CHECK (true);

