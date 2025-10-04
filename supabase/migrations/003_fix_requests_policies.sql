-- Fix RLS policies for requests table to use profiles table instead of auth.users
-- This fixes the "permission denied for table users" error

-- Drop existing policies
DROP POLICY IF EXISTS "Designers can view all requests" ON requests;
DROP POLICY IF EXISTS "Analysts can view all requests" ON requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON requests;
DROP POLICY IF EXISTS "Designers and admins can create requests" ON requests;
DROP POLICY IF EXISTS "Designers can update own requests" ON requests;
DROP POLICY IF EXISTS "Analysts can update assigned requests" ON requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON requests;
DROP POLICY IF EXISTS "Only admins can delete requests" ON requests;

-- Create new policies using profiles table

-- Designers can view all requests (to see their own requests)
CREATE POLICY "Designers can view all requests" ON requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'designer'
        )
    );

-- Analysts can view all requests (to see assigned requests)
CREATE POLICY "Analysts can view all requests" ON requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'analyst'
        )
    );

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Designers and admins can create requests
CREATE POLICY "Designers and admins can create requests" ON requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('designer', 'admin')
        )
    );

-- Designers can update their own requests
CREATE POLICY "Designers can update own requests" ON requests
    FOR UPDATE USING (
        requester_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'designer'
        )
    );

-- Analysts can update assigned requests
CREATE POLICY "Analysts can update assigned requests" ON requests
    FOR UPDATE USING (
        assignee_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'analyst'
        )
    );

-- Admins can update all requests
CREATE POLICY "Admins can update all requests" ON requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete requests
CREATE POLICY "Only admins can delete requests" ON requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

