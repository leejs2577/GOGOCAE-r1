-- Create separate storage buckets for different file types
-- This improves security, access control, and file organization

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow signed URL generation" ON storage.objects;
DROP POLICY IF EXISTS "Allow file uploads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow file downloads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow file deletion for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Create separate buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('request-files', 'request-files', false),
  ('report-files', 'report-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for request-files bucket (designer uploads)
CREATE POLICY "Designers can upload request files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('designer', 'admin')
  )
);

CREATE POLICY "Users can view request files from accessible requests" ON storage.objects
FOR SELECT TO authenticated
USING (
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

CREATE POLICY "Designers can delete their request files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.file_path = storage.objects.name
    AND EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_files.request_id
      AND (
        requests.requester_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  )
);

-- Storage policies for report-files bucket (analyst uploads)
CREATE POLICY "Analysts can upload report files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('analyst', 'admin')
  )
);

CREATE POLICY "Users can view report files from accessible requests" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'report-files' AND
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

CREATE POLICY "Analysts can delete their report files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'report-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.file_path = storage.objects.name
    AND EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_files.request_id
      AND (
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

-- Update request_files table to include file category
ALTER TABLE request_files 
ADD COLUMN IF NOT EXISTS file_category VARCHAR(20) DEFAULT 'request' 
CHECK (file_category IN ('request', 'report'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_request_files_category ON request_files(file_category);
CREATE INDEX IF NOT EXISTS idx_request_files_metadata_type ON request_files USING GIN (metadata);

-- Update existing files to have correct category
UPDATE request_files 
SET file_category = 'report' 
WHERE metadata->>'type' = 'report';

-- Comment on the new structure
COMMENT ON COLUMN request_files.file_category IS 'File category: request (designer uploads) or report (analyst uploads)';

