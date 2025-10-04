-- Update requests table schema to match new field names

-- Add new columns
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS analysis_type TEXT,
ADD COLUMN IF NOT EXISTS requested_deadline TIMESTAMP WITH TIME ZONE;

-- Migrate existing data if any
UPDATE requests 
SET 
  car_model = vehicle_type,
  analysis_type = '구조해석',
  requested_deadline = due_date
WHERE car_model IS NULL;

-- Make new columns required (after data migration)
ALTER TABLE requests 
ALTER COLUMN car_model SET NOT NULL,
ALTER COLUMN analysis_type SET NOT NULL,
ALTER COLUMN requested_deadline SET NOT NULL;

-- Drop old columns
ALTER TABLE requests 
DROP COLUMN IF EXISTS vehicle_type,
DROP COLUMN IF EXISTS due_date;

