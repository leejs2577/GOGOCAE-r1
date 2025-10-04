-- Update request_files table schema to match API expectations
-- Add missing columns and update existing ones

-- First, drop storage policies that might reference old columns
DROP POLICY IF EXISTS "Users can view files from accessible requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from their own requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to their own requests" ON storage.objects;

-- Add missing columns
ALTER TABLE request_files 
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing columns to match API expectations
-- Handle storage_path column safely
DO $$ 
BEGIN
    -- If storage_path exists and file_path doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'request_files' AND column_name = 'storage_path')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'request_files' AND column_name = 'file_path') THEN
        ALTER TABLE request_files RENAME COLUMN storage_path TO file_path;
    -- If both exist, copy data and drop storage_path
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'request_files' AND column_name = 'storage_path')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'request_files' AND column_name = 'file_path') THEN
        UPDATE request_files 
        SET file_path = COALESCE(file_path, storage_path)
        WHERE file_path IS NULL AND storage_path IS NOT NULL;
        
        ALTER TABLE request_files DROP COLUMN storage_path;
    END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_request_files_updated_at 
    BEFORE UPDATE ON request_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to include assignee_id check for analysts
DROP POLICY IF EXISTS "Users can upload files to their own requests" ON request_files;

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

DROP POLICY IF EXISTS "Users can delete files from their own requests" ON request_files;

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

-- Recreate storage policies for the request-files bucket
CREATE POLICY "Users can view files from accessible requests" ON storage.objects
FOR SELECT USING (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.file_path = storage.objects.name
    AND EXISTS (
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
  )
);

CREATE POLICY "Users can upload files to accessible requests" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.file_path = storage.objects.name
    AND EXISTS (
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
  )
);

CREATE POLICY "Users can delete files from accessible requests" ON storage.objects
FOR DELETE USING (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.file_path = storage.objects.name
    AND EXISTS (
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
  )
);

