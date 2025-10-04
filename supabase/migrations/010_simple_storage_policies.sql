-- Simplify storage policies to allow all authenticated users
-- This is a temporary solution to fix upload issues

-- Drop all existing storage policies for request-files bucket
DROP POLICY IF EXISTS "Allow signed URL generation" ON storage.objects;
DROP POLICY IF EXISTS "Allow file uploads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow file downloads for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow file deletion for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Create very simple policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'request-files')
WITH CHECK (bucket_id = 'request-files');

