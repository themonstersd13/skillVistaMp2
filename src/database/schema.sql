CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key VARCHAR(50) NOT NULL UNIQUE,
  role_name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(120),
  academic_year SMALLINT CHECK (academic_year BETWEEN 1 AND 4),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty_student_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  CONSTRAINT faculty_student_map_unique UNIQUE (faculty_user_id, student_user_id),
  CONSTRAINT faculty_student_map_distinct_users CHECK (faculty_user_id <> student_user_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  faculty_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  interview_type VARCHAR(50) NOT NULL DEFAULT 'mock',
  academic_year SMALLINT CHECK (academic_year BETWEEN 1 AND 4),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  audio_file_name VARCHAR(255),
  audio_storage_key VARCHAR(500),
  transcript_mongo_id VARCHAR(64),
  overall_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  queue_job_id VARCHAR(100),
  evaluation_mongo_id VARCHAR(64),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evaluation_status_valid CHECK (
    status IN ('queued', 'processing', 'completed', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_year ON users(department, academic_year);
CREATE INDEX IF NOT EXISTS idx_users_active_created_at ON users(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faculty_student_map_faculty ON faculty_student_map(faculty_user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_student_map_student ON faculty_student_map(student_user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id_created_at ON interviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_faculty_user_id ON interviews(faculty_user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_year_type ON interviews(academic_year, interview_type);
CREATE INDEX IF NOT EXISTS idx_interviews_completed_at ON interviews(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluation_status_status_updated_at ON evaluation_status(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluation_status_queue_job_id ON evaluation_status(queue_job_id);
