-- Allow users to delete their own profile from the public.users table
CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);
