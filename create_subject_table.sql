-- SQL script to create the grades_subject table manually
-- Run this in your PostgreSQL database if migrations aren't working

CREATE TABLE IF NOT EXISTS grades_subject (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID REFERENCES accounts_customuser(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS grades_subject_name_idx ON grades_subject(name);
CREATE INDEX IF NOT EXISTS grades_subject_created_by_idx ON grades_subject(created_by_id);
CREATE INDEX IF NOT EXISTS grades_subject_is_active_idx ON grades_subject(is_active);

-- Optional: Insert some default subjects
-- Uncomment if you want to pre-populate with common subjects
/*
INSERT INTO grades_subject (id, name, is_active, created_at, updated_at) 
VALUES 
    (gen_random_uuid(), 'Mathematics', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'English', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Science', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Social Studies', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Art', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Physical Education', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
*/

-- Create or update the migration record so Django knows this migration was applied
INSERT INTO django_migrations (app, name, applied)
VALUES ('grades', '0003_subject', CURRENT_TIMESTAMP)
ON CONFLICT (app, name) DO NOTHING;

SELECT 'grades_subject table created successfully!' as status;
