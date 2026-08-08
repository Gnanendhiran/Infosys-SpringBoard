-- ============================================
-- FIX: Row-Level Security Policies for resume_analysis
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Add missing RLS policies for resume_analysis table

-- 1. Allow users to insert analysis for their own resumes
CREATE POLICY "Users can insert own analysis"
  ON public.resume_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_analysis.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- 2. Allow users to update analysis for their own resumes
CREATE POLICY "Users can update own analysis"
  ON public.resume_analysis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_analysis.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- 3. Allow users to delete analysis for their own resumes
CREATE POLICY "Users can delete own analysis"
  ON public.resume_analysis FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_analysis.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- 4. Also add update policy for resumes table (was missing)
CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('resume_analysis', 'resumes')
ORDER BY tablename, cmd;
