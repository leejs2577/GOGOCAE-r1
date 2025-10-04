-- Fix storage policies to simplify and allow signed URL generation
-- Drop existing policies for the 'request-files' bucket
DROP POLICY IF EXISTS "Users can view files from accessible requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to accessible requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from accessible requests" ON storage.objects;

-- Create a policy that allows authenticated users to select objects in the 'request-files' bucket
CREATE POLICY "Allow authenticated select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'request-files');

-- Create a policy that allows authenticated users to insert objects in the 'request-files' bucket
CREATE POLICY "Allow authenticated insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'request-files');

-- Create a policy that allows authenticated users to update objects in the 'request-files' bucket
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'request-files');

-- Create a policy that allows authenticated users to delete objects in the 'request-files' bucket
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'request-files');

