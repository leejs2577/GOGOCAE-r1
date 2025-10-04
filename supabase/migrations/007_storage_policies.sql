-- Storage bucket policies for request files
-- Storage bucket 'request-files' should already exist

-- Check if bucket exists (optional verification)
-- SELECT * FROM storage.buckets WHERE id = 'request-files';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view files from accessible requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to their own requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from their own requests" ON storage.objects;

-- Create RLS policies for storage.objects
CREATE POLICY "Users can view files from accessible requests" ON storage.objects
FOR SELECT USING (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.storage_path = storage.objects.name
    AND (
      request_files.uploaded_by = auth.uid() OR
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
    )
  )
);

CREATE POLICY "Users can upload files to their own requests" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'request-files' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete files from their own requests" ON storage.objects
FOR DELETE USING (
  bucket_id = 'request-files' AND
  EXISTS (
    SELECT 1 FROM request_files
    WHERE request_files.storage_path = storage.objects.name
    AND (
      request_files.uploaded_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);

