-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    vehicle_type TEXT,
    request_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policies for requests table

-- Designers can view all requests (to see their own requests)
CREATE POLICY "Designers can view all requests" ON requests
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'designer'
        )
    );

-- Analysts can view all requests (to see assigned requests)
CREATE POLICY "Analysts can view all requests" ON requests
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'analyst'
        )
    );

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON requests
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Designers and admins can create requests
CREATE POLICY "Designers and admins can create requests" ON requests
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('designer', 'admin')
        )
    );

-- Designers can update their own requests
CREATE POLICY "Designers can update own requests" ON requests
    FOR UPDATE USING (
        requester_id = auth.uid() AND
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'designer'
        )
    );

-- Analysts can update assigned requests
CREATE POLICY "Analysts can update assigned requests" ON requests
    FOR UPDATE USING (
        assignee_id = auth.uid() AND
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'analyst'
        )
    );

-- Admins can update all requests
CREATE POLICY "Admins can update all requests" ON requests
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Only admins can delete requests
CREATE POLICY "Only admins can delete requests" ON requests
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_requests_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION public.update_requests_updated_at_column();

