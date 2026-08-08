-- Add missing RLS policies for resume_analysis table

-- Allow users to insert analysis for their own resumes
CREATE POLICY "Users can insert own analysis"
  ON public.resume_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_analysis.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- Allow users to update analysis for their own resumes
CREATE POLICY "Users can update own analysis"
  ON public.resume_analysis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_analysis.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- Allow users to delete analysis for their own resumes
CREATE POLICY "Users can delete own analysis"
  ON public.resume_analysis FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_analysis.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- Also add update policy for resumes table (was missing)
CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);
