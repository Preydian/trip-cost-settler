-- Migration: Add user_id to trips for email/password auth
-- Run this in the Supabase SQL Editor.
-- Also disable "Confirm email" in Supabase Dashboard > Authentication > Providers > Email.

-- 1. Add user_id column (nullable so existing anonymous trips still work)
ALTER TABLE public.trips
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_trips_user ON public.trips(user_id);

-- 2. Update RLS policies for trips
DROP POLICY IF EXISTS "Allow all access to trips" ON public.trips;

-- Anyone can read any trip (trips are shareable via link)
CREATE POLICY "Anyone can read trips"
  ON public.trips FOR SELECT
  USING (true);

-- Authenticated users can create trips (user_id must match)
CREATE POLICY "Auth users can create trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anonymous users can also create trips (user_id must be null)
CREATE POLICY "Anon users can create trips"
  ON public.trips FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Owner or anonymous trips can be updated
CREATE POLICY "Owner or anon can update trips"
  ON public.trips FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Owner or anonymous trips can be deleted
CREATE POLICY "Owner or anon can delete trips"
  ON public.trips FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL);
