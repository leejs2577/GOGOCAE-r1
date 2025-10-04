-- Clean storage setup for file uploads
-- This replaces all previous storage-related migrations

-- 1. Create request_files table with proper schema
CREATE TABLE IF NOT EXISTS request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_category TEXT NOT NULL CHECK (file_category IN ('request', 'report')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_request_files_request_id ON request_files(request_id);
CREATE INDEX IF NOT EXISTS idx_request_files_uploaded_by ON request_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_request_files_category ON request_files(file_category);

-- 3. Enable RLS
ALTER TABLE request_files ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for request_files table
DROP POLICY IF EXISTS "Users can view files from accessible requests" ON request_files;
DROP POLICY IF EXISTS "Users can upload files to accessible requests" ON request_files;
DROP POLICY IF EXISTS "Users can delete files from accessible requests" ON request_files;

CREATE POLICY "Users can view files from accessible requests" ON request_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM requests
    WHERE requests.id = request_files.request_id
    AND (
      requests.requester_id = auth.uid() OR
      requests.assignee_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can upload files to accessible requests" ON request_files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM requests
    WHERE requests.id = request_files.request_id
    AND (
      requests.requester_id = auth.uid() OR
      requests.assignee_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can delete files from accessible requests" ON request_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM requests
    WHERE requests.id = request_files.request_id
    AND (
      requests.requester_id = auth.uid() OR
      requests.assignee_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_request_files_updated_at ON request_files;
CREATE TRIGGER update_request_files_updated_at 
    BEFORE UPDATE ON request_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Storage bucket policies (will be applied if bucket exists)
-- Note: Bucket must be created manually in Supabase Dashboard
-- Name: 'request-files', Public: false, Size limit: 50MB

-- Drop all existing storage policies to start fresh
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Create simple storage policies for authenticated users
CREATE POLICY "Allow authenticated access to request-files" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'request-files')
WITH CHECK (bucket_id = 'request-files');

-- 7. Add helpful comments
COMMENT ON TABLE request_files IS 'Stores metadata for files uploaded to requests';
COMMENT ON COLUMN request_files.file_category IS 'request: uploaded by designer, report: uploaded by analyst';
COMMENT ON COLUMN request_files.metadata IS 'Additional file metadata like original name, special notes';

