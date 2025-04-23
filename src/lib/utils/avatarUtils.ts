import { SupabaseClient } from '@supabase/supabase-js';
import { AVATAR_PATH_FORMAT } from '@/types/supabase';

/**
 * Constants for avatar handling
 */
export const AVATAR_BUCKET = 'avatars';
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validates an avatar file
 * @param file File to validate
 * @returns Object containing validation result and optional error message
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be an image (JPEG, PNG, WebP, or GIF)'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 2MB'
    };
  }

  return { valid: true };
}

/**
 * Uploads an avatar image to Supabase Storage
 * @param supabase Supabase client
 * @param userId User ID
 * @param file File to upload
 * @returns URL of the uploaded avatar or null if upload failed
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string | null> {
  // Get file extension
  const fileExt = file.name.split('.').pop();
  const fileName = `${AVATAR_PATH_FORMAT.replace('{user_id}', userId)}.${fileExt}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, {
      upsert: true, // Replace existing file
      contentType: file.type
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Gets the avatar URL for a user
 * @param supabase Supabase client
 * @param avatarPath Path of the avatar in storage
 * @returns Public URL of the avatar
 */
export function getAvatarUrl(
  supabase: SupabaseClient,
  avatarPath: string | null
): string | null {
  if (!avatarPath) return null;

  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(avatarPath);

  return data.publicUrl;
}

/**
 * Updates the avatar_url in user_profiles table
 * @param supabase Supabase client
 * @param userId User ID
 * @param avatarUrl URL of the avatar
 * @returns Boolean indicating success
 */
export async function updateUserAvatarUrl(
  supabase: SupabaseClient,
  userId: string,
  avatarUrl: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  return !error;
} 