import { Database } from './database.types';

export type Tables = Database['public']['Tables'];

export type UserProfile = Tables['user_profiles']['Row'];

export interface UserProfileWithAvatar extends UserProfile {
  avatar_url: string | null;
  industry: string | null;
  job_title: string | null;
}

// Helper type for insert operations
export type UserProfileInsert = Tables['user_profiles']['Insert'];

// Helper type for update operations
export type UserProfileUpdate = Tables['user_profiles']['Update'];

// Path format for avatar storage
export const AVATAR_PATH_FORMAT = '{user_id}/avatar'; // Extension will be added when uploading 