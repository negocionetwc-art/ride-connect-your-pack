-- Migration: Add unique constraint to group names and create storage bucket
-- Description: Prevents duplicate group names and sets up storage for group covers

-- =====================================================
-- 1. ADD UNIQUE CONSTRAINT TO GROUP NAMES
-- =====================================================

-- Add unique constraint to group names (case-insensitive)
ALTER TABLE public.groups 
ADD CONSTRAINT groups_name_unique UNIQUE (name);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_groups_name_lower ON public.groups (LOWER(name));

-- =====================================================
-- 2. STORAGE BUCKET CONFIGURATION
-- =====================================================

-- Create storage bucket for group covers if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-covers',
  'group-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- 3. STORAGE POLICIES
-- =====================================================

-- Policy: Anyone can view group cover images (public bucket)
CREATE POLICY IF NOT EXISTS "Group covers are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group-covers');

-- Policy: Authenticated users can upload group covers
CREATE POLICY IF NOT EXISTS "Authenticated users can upload group covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'group-covers');

-- Policy: Users can update their own group covers (group owners only)
CREATE POLICY IF NOT EXISTS "Users can update their own group covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own group covers (group owners only)
CREATE POLICY IF NOT EXISTS "Users can delete their own group covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON CONSTRAINT groups_name_unique ON public.groups IS 
'Ensures group names are unique across the platform';

COMMENT ON INDEX idx_groups_name_lower IS 
'Speeds up case-insensitive group name lookups';
