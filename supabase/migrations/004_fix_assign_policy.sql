-- Fix RLS policies specifically for analyst assignment/unassignment
-- Allow analysts to view and update requests for assignment

-- Drop existing policies that prevent analyst assignment
DROP POLICY IF EXISTS "Analysts can view all requests" ON requests;
DROP POLICY IF EXISTS "Analysts can update assigned requests" ON requests;

-- Create new policies that allow analysts to view and update requests for assignment
CREATE POLICY "Analysts can view all requests" ON requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'analyst'
        )
    );

CREATE POLICY "Analysts can update assigned requests" ON requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'analyst'
        )
    );

