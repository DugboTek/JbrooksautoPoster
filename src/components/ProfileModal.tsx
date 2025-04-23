'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider'; // Adjust path
import { UserCircleIcon, PhotoIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Example icons

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  full_name: string | null;
  industry: string | null;
  job_title: string | null;
  avatar_url: string | null;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { supabase, user } = useSupabase();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('full_name, industry, job_title, avatar_url')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? '');
        setIndustry(data.industry ?? '');
        setJobTitle(data.job_title ?? '');
        
        // Add cache-busting to avatar URL
        if (data.avatar_url) {
          const avatarUrl = data.avatar_url.includes('?t=') 
            ? data.avatar_url 
            : `${data.avatar_url}?t=${Date.now()}`;
          setAvatarPreview(avatarUrl);
        } else {
          setAvatarPreview(null);
        }
        
        setAvatarFile(null); // Reset file input state
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(`Failed to load profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Fetch profile when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    } else if (!isOpen) {
        // Reset state when modal closes
        setProfile(null);
        setFullName('');
        setIndustry('');
        setJobTitle('');
        setAvatarFile(null);
        setAvatarPreview(null);
        setError(null);
        setIsLoading(false);
        setIsUploading(false);
        setIsSaving(false);
    }
  }, [isOpen, user, fetchProfile]);

  // Add a separate effect to listen for avatar updates
  useEffect(() => {
    // Add listener for avatar updates from other components
    const handleAvatarUpdate = () => {
      if (isOpen && user) {
        fetchProfile();
      }
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
    };
  }, [isOpen, user, fetchProfile]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (e.g., size, type)
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should not exceed 5MB.');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
           setError('Invalid file type. Please upload JPG, PNG, GIF, or WEBP.');
           return;
      }

      setError(null);
      setAvatarFile(file);
      
      // Revoke any previous object URL to prevent memory leaks
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      
      // Create object URL for preview with a random query parameter to avoid caching
      const previewUrl = `${URL.createObjectURL(file)}#${Date.now()}`;
      setAvatarPreview(previewUrl);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setIsUploading(false); // Reset upload status
    setError(null);
    let uploadedAvatarUrl: string | null = profile?.avatar_url ?? null; // Start with existing or null

    try {
      // 1. Upload new avatar if selected
      if (avatarFile) {
        setIsUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`; // Use user.id as the first folder name to match RLS policy

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true }); // upsert=true overwrites existing

        if (uploadError) throw uploadError;

        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Add a timestamp query parameter to prevent caching
        uploadedAvatarUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null;
        setIsUploading(false);
      }

      // 2. Update profile data in the database
      const updates = {
        full_name: fullName,
        industry: industry,
        job_title: jobTitle,
        avatar_url: uploadedAvatarUrl,
        updated_at: new Date().toISOString(), // Keep track of updates
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Success: Close modal and maybe show a success message
      onClose();
      
      // Dispatch an event to notify that the avatar has been updated
      window.dispatchEvent(new Event('avatar-updated'));
      
      // Consider adding a toast notification here

    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // Cleanup effect for object URLs
  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts or modal closes
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          aria-label="Close profile modal"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Profile</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading profile...</p> {/* Or a spinner */}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3 flex items-center justify-center ring-2 ring-offset-2 ring-indigo-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif, image/webp"
                className="hidden"
                aria-label="Upload profile photo"
              />
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading || isSaving}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpTrayIcon className={`-ml-1 mr-2 h-5 w-5 ${isUploading ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isUploading ? 'Uploading...' : (avatarFile ? 'Change Photo' : 'Upload Photo')}
              </button>
            </div>

            {/* Form Fields */}
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Your full name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Technology, Marketing"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Software Engineer, Content Strategist"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileModal; 