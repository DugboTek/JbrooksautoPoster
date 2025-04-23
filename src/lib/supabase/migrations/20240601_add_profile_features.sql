-- Migration: Add User Profile Features (June 2024)

-- 1. Add new columns to user_profiles table if they don't exist
DO $$
BEGIN
    -- Check if job_title column exists, add if it doesn't
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'job_title'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN job_title TEXT;
    END IF;

    -- Check if avatar_url column exists, add if it doesn't
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- Ensure industry column exists (though schema shows it might already)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'industry'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN industry TEXT;
    END IF;
END
$$;

-- 2. Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', TRUE
WHERE NOT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'avatars'
);

-- 3. Set up storage policies for the avatars bucket
-- First, drop any existing policies for the avatars bucket to avoid conflicts
DO $$
BEGIN
    -- Delete public read policy if it exists
    DELETE FROM storage.policies 
    WHERE bucket_id = 'avatars' AND name = 'Avatar images are publicly accessible';
    
    -- Delete upload policy if it exists
    DELETE FROM storage.policies 
    WHERE bucket_id = 'avatars' AND name = 'Users can upload their own avatar';
    
    -- Delete update policy if it exists
    DELETE FROM storage.policies 
    WHERE bucket_id = 'avatars' AND name = 'Users can update their own avatar';
    
    -- Delete delete policy if it exists
    DELETE FROM storage.policies 
    WHERE bucket_id = 'avatars' AND name = 'Users can delete their own avatar';
EXCEPTION
    WHEN undefined_table THEN
        -- Handle case where storage.policies might not exist
        NULL;
END
$$;

-- Now create the policies
-- 3.1 Public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 3.2 Upload access (for authenticated users)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3.3 Update access (for authenticated users)
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3.4 Delete access (for authenticated users)
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
); 