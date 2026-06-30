-- GTH TechVerse 2026 — Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.points_history CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.task_submissions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- 1. Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT UNIQUE NOT NULL,
    mentor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- References auth.users(id)
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Student' CHECK (role IN ('Student', 'Admin')),
    department TEXT,
    team TEXT, -- Stores team name or references team_name
    photo TEXT,
    total_points INTEGER DEFAULT 0 NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Additional fields for frontend compatibility
    enrollment_no TEXT,
    branch TEXT,
    year INTEGER,
    batch TEXT,
    bio TEXT,
    skills TEXT, -- comma-separated or JSON string
    linkedin TEXT,
    github TEXT,
    instagram TEXT
);

-- 3. Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instruction_pdf TEXT NOT NULL, -- Public storage URL
    assigned_to TEXT NOT NULL DEFAULT 'ALL' CHECK (assigned_to IN ('ALL', 'BATCH', 'TEAM')),
    assigned_target TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    rules TEXT,
    points INTEGER DEFAULT 0 NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    reference_file TEXT, -- Public storage URL
    assigned_to TEXT NOT NULL DEFAULT 'ALL' CHECK (assigned_to IN ('ALL', 'BATCH', 'TEAM')),
    assigned_target TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create task_submissions table
CREATE TABLE public.task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    uploaded_file TEXT NOT NULL, -- Public storage URL
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED')),
    review_comment TEXT,
    points_awarded INTEGER DEFAULT 0 NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, task_id)
);

-- 6. Create referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_student UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    new_student UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    points_awarded INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create points_history table
CREATE TABLE public.points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    given_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- --- TEAMS POLICIES ---
CREATE POLICY "Allow public select for authenticated users on teams"
    ON public.teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access for admins on teams"
    ON public.teams FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- --- USERS POLICIES ---
CREATE POLICY "Allow select for own user or admins"
    ON public.users FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Allow insert for self (registration) or admins"
    ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Allow update for own profile or admins"
    ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- --- PROJECTS POLICIES ---
CREATE POLICY "Allow select for authenticated users on projects"
    ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access for admins on projects"
    ON public.projects FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- --- TASKS POLICIES ---
CREATE POLICY "Allow select for authenticated users on tasks"
    ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access for admins on tasks"
    ON public.tasks FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- --- TASK SUBMISSIONS POLICIES ---
CREATE POLICY "Allow select for own submissions or admins"
    ON public.task_submissions FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Allow insert for students own submissions"
    ON public.task_submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Allow update for admins or students own pending submissions"
    ON public.task_submissions FOR UPDATE TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

-- --- REFERRALS POLICIES ---
CREATE POLICY "Allow select for own referrals or admins"
    ON public.referrals FOR SELECT TO authenticated USING (referrer_student = auth.uid() OR new_student = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Allow insert for new referrals"
    ON public.referrals FOR INSERT TO authenticated WITH CHECK (referrer_student = auth.uid() OR new_student = auth.uid() OR public.is_admin(auth.uid()));

-- --- POINTS HISTORY POLICIES ---
CREATE POLICY "Allow select for own points history or admins"
    ON public.points_history FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Allow write access for admins or system"
    ON public.points_history FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR student_id = auth.uid());

-- --- NOTIFICATIONS POLICIES ---
CREATE POLICY "Allow select for own notifications or admins"
    ON public.notifications FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Allow update for own notifications (mark read) or admins"
    ON public.notifications FOR UPDATE TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

-- --- STORAGE BUCKETS SETUP ---
-- In Supabase, bucket creation can be handled via dashboard or using SQL:
INSERT INTO storage.buckets (id, name, public) VALUES 
('project-pdfs', 'project-pdfs', true),
('task-submissions', 'task-submissions', true),
('profile-images', 'profile-images', true),
('documents', 'documents', true),
('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow public access to read objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage project-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow students and admins to insert into task-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow students and admins to insert into profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to insert into documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to insert into images" ON storage.objects;

CREATE POLICY "Allow public access to read objects"
    ON storage.objects FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage project-pdfs"
    ON storage.objects FOR ALL USING (bucket_id = 'project-pdfs' AND public.is_admin(auth.uid()));

CREATE POLICY "Allow students and admins to insert into task-submissions"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task-submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Allow students and admins to insert into profile-images"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert into documents"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert into images"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- --- ATTENDANCE TABLE & POLICIES ---
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for own attendance or admins on attendance"
    ON public.attendance FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Allow write access for admins on attendance"
    ON public.attendance FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

