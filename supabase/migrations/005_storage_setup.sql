-- Create request_files table for file metadata
CREATE TABLE IF NOT EXISTS request_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE request_files ENABLE ROW LEVEL SECURITY;

-- Create policies for request_files table
CREATE POLICY "Users can view files from their own requests" ON request_files
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

CREATE POLICY "Users can upload files to their own requests" ON request_files
    FOR INSERT WITH CHECK (
        EXISTS (
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
    );

CREATE POLICY "Users can delete files from their own requests" ON request_files
    FOR DELETE USING (
        EXISTS (
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
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER update_request_files_updated_at
    BEFORE UPDATE ON request_files
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Note: Storage bucket 'request-files' should be created manually in Supabase Dashboard
-- This is due to permission issues with creating storage buckets via SQL
-- 50MB file size limit applies to Supabase free tier

