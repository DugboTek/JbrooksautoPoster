# Supabase Setup Guide for User Profile Feature

This guide provides detailed instructions for setting up your Supabase project to support the user profile feature, including avatar uploads.

## Prerequisites

- Access to your Supabase project dashboard
- Admin privileges for your Supabase project

## Setup Steps

### 1. Apply Database Migration

We've created a migration file (`migrations/20240601_add_profile_features.sql`) that will:
- Add the required columns to the `user_profiles` table
- Create the `avatars` storage bucket
- Set up all necessary security policies

To apply this migration:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `src/lib/supabase/migrations/20240601_add_profile_features.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute the migration

The migration is designed to be idempotent (can be run multiple times without issues), so if any part already exists, it will be safely skipped.

### 2. Verify Database Schema

After applying the migration, verify that the `user_profiles` table has been updated with the new columns:

1. Go to the "Table Editor" in your Supabase dashboard
2. Select the `user_profiles` table
3. Confirm the presence of:
   - `industry` column (may already exist)
   - `job_title` column (newly added)
   - `avatar_url` column (newly added)

### 3. Verify Storage Bucket

Confirm that the `avatars` storage bucket has been created:

1. Go to the "Storage" section in your Supabase dashboard
2. You should see an `avatars` bucket with public access enabled
3. If not visible, you may need to manually create it:
   - Click "Create Bucket"
   - Name: `avatars`
   - Check "Enable public bucket" option
   - Click "Create bucket"

### 4. Verify Storage Policies

Check that the required policies have been applied to the `avatars` bucket:

1. Go to the "Storage" section in your Supabase dashboard
2. Click on the `avatars` bucket
3. Click on "Policies" tab
4. Confirm the presence of:
   - Public read access policy
   - Authenticated upload policy
   - Authenticated update policy
   - Authenticated delete policy

If any policies are missing, you can manually create them using the SQL editor with the following format:

```sql
-- For public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- For authenticated upload access
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For authenticated update access
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

-- For authenticated delete access
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## File Organization

The avatar file organization in storage follows this structure:

```
avatars/
└── {user_id}/
    └── avatar.{extension}
```

Where:
- `{user_id}` is the UUID of the user
- `{extension}` is the file extension of the uploaded image (jpg, png, etc.)

This organization ensures that:
1. Each user can only access their own avatar files
2. Avatars are easily located in a predictable path
3. New uploads replace existing avatars automatically

## Implementation Notes

### Frontend Implementation

The frontend implementation uses:
- `uploadAvatar` utility function for handling file uploads
- `getAvatarUrl` utility function for displaying avatars
- `validateAvatarFile` utility function for client-side validation

These utilities are available in `src/lib/utils/avatarUtils.ts`.

### RLS Path Structure

The Row Level Security policies for the `avatars` bucket use the path structure to enforce access control:

- `storage.foldername(name)[1]` extracts the first folder name from the path
- This is compared with `auth.uid()::text` to ensure users can only access their own files

For example, with a path like `123e4567-e89b-12d3-a456-426614174000/avatar.jpg`:
- `storage.foldername(name)` returns `['123e4567-e89b-12d3-a456-426614174000']`
- `storage.foldername(name)[1]` returns `'123e4567-e89b-12d3-a456-426614174000'`
- This is compared against the user's ID to enforce access control

## Testing

After setup, you can test the configuration by:

1. Using the frontend application to upload an avatar
2. Checking the storage bucket to confirm the file was uploaded to the correct path
3. Verifying that the `avatar_url` column in the user's profile record has been updated

## Troubleshooting

If you encounter issues:

1. **Database Errors**: Check for any error messages in the SQL editor when applying migrations
2. **Storage Permissions**: Verify the RLS policies are correctly applied to the `avatars` bucket
3. **File Access Issues**: Confirm that the public access setting is enabled for the `avatars` bucket
4. **Upload Errors**: Look for any logged errors in the browser console during file uploads
5. **Path Issues**: Ensure that the file path structure matches the expected format used in RLS policies 