-- Fix duplicate filename issue by removing unnecessary unique constraint
-- and ensuring file_name column allows duplicates within the same request

-- 1. First, check if there's any unique constraint on file_name
-- We'll drop any existing unique constraints that might cause issues

-- Drop any unique constraints on file_name if they exist
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find unique constraints on file_name column
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'request_files'::regclass 
    AND contype = 'u' 
    AND conkey IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM pg_attribute 
        WHERE attrelid = conrelid 
        AND attname = 'file_name' 
        AND attnum = ANY(conkey)
    );
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE request_files DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped unique constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No unique constraint found on file_name column';
    END IF;
END $$;

-- 2. Add a composite unique constraint if needed (request_id + file_path should be unique)
-- But first check if it already exists
DO $$
BEGIN
    -- Only add if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'request_files'::regclass 
        AND contype = 'u' 
        AND conname = 'unique_request_file_path'
    ) THEN
        ALTER TABLE request_files 
        ADD CONSTRAINT unique_request_file_path 
        UNIQUE (request_id, file_path);
        
        RAISE NOTICE 'Added unique constraint on (request_id, file_path)';
    ELSE
        RAISE NOTICE 'Unique constraint on (request_id, file_path) already exists';
    END IF;
END $$;

-- 3. Update any existing duplicate file_name entries to have unique names
-- This is a safety measure in case there are existing duplicates
UPDATE request_files 
SET file_name = file_name || '_' || EXTRACT(EPOCH FROM uploaded_at)::TEXT
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY request_id, file_name ORDER BY uploaded_at) as rn
        FROM request_files
    ) t 
    WHERE rn > 1
);

-- 4. Add helpful comment
COMMENT ON COLUMN request_files.file_name IS 'Original filename for display purposes (can be duplicated within same request)';
COMMENT ON COLUMN request_files.file_path IS 'Unique storage path for the file (must be unique within same request)';

