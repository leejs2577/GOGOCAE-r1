-- Storage bucket setup for request files
-- NOTE: The 'request-files' bucket must be created manually in Supabase Dashboard
-- Go to Storage > Create Bucket > Name: request-files > Public: false

-- This migration only sets up RLS policies for the bucket
-- Manual bucket creation is required due to storage.objects table ownership restrictions

-- Check if bucket exists (informational)
-- SELECT * FROM storage.buckets WHERE id = 'request-files';

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files from accessible requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to accessible requests" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from accessible requests" ON storage.objects;

-- Create simple policies for authenticated users (if bucket exists)
-- These policies will only work if the 'request-files' bucket has been created manually

DO $$
BEGIN
  -- Only create policies if the bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'request-files') THEN
    -- Create policies for the request-files bucket
    EXECUTE 'CREATE POLICY "Allow authenticated select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = ''request-files'')';
    
    EXECUTE 'CREATE POLICY "Allow authenticated insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = ''request-files'')';
    
    EXECUTE 'CREATE POLICY "Allow authenticated update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = ''request-files'')';
    
    EXECUTE 'CREATE POLICY "Allow authenticated delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = ''request-files'')';
    
    RAISE NOTICE 'Storage policies created for request-files bucket';
  ELSE
    RAISE NOTICE 'request-files bucket does not exist. Please create it manually in Supabase Dashboard.';
  END IF;
END $$;
