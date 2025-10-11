-- Fix RLS policies for profiles table to allow server-side access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new policies that allow server-side access
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add a policy for service role access (if needed)
CREATE POLICY "Enable all access for service role" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

