# Supabase Setup Guide

Before the upload feature works, you need to configure Supabase. It takes ~5 minutes.

## 1. Create a Supabase Project

1. Go to https://supabase.com and sign up (free)
2. Click "New project"
3. Choose a name (e.g. "deskbub"), set a database password (save it!)
4. Choose region closest to your users (e.g. US East)
5. Wait ~2 minutes for the project to be created

## 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these values into your `.env.local` file:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click "New bucket"
3. Name: `pet-photos`
4. Check "Public bucket"
5. Click "Create bucket"

## 4. Create Database Table & Policies

Go to **SQL Editor** in the left sidebar, paste and run this:

```sql
-- Create the generated_pets table
CREATE TABLE generated_pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  processed_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE generated_pets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own pets
CREATE POLICY "Users can view own pets"
  ON generated_pets
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Policy: Users can insert their own pets
CREATE POLICY "Users can insert own pets"
  ON generated_pets
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Storage policy: Allow public read
CREATE POLICY "Public can view pet photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Storage policy: Authenticated users can upload
CREATE POLICY "Users can upload pet photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');
```
