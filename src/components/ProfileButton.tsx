'use client';

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider'; // Adjust path as needed
import { UserIcon } from '@heroicons/react/24/solid'; // Example icon, choose as needed

interface ProfileButtonProps {
  onClick: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick }) => {
  const { supabase, user } = useSupabase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Function to force refresh avatar
  const refreshAvatar = () => {
    setLastRefresh(Date.now());
  };

  // Make the refreshAvatar function available through ref
  React.useEffect(() => {
    // Add a global event listener for avatar updates
    window.addEventListener('avatar-updated', refreshAvatar);
    return () => {
      window.removeEventListener('avatar-updated', refreshAvatar);
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile avatar:', error);
        } else if (data?.avatar_url) {
            // Check if the URL is already absolute (from storage)
            if (data.avatar_url.startsWith('http')) {
                 // Add a timestamp to prevent caching issues
                 const url = data.avatar_url.includes('?t=') 
                   ? data.avatar_url 
                   : `${data.avatar_url}?t=${Date.now()}`;
                 setAvatarUrl(url);
            } else {
                // If it's just a path, construct the public URL (less common if storing full URL)
                // This logic might need adjustment based on exactly what's stored
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(data.avatar_url); // Assumes stored path is like 'public/user_id.png'
                
                // Add a timestamp to prevent caching
                const url = publicUrlData?.publicUrl 
                  ? `${publicUrlData.publicUrl}?t=${Date.now()}` 
                  : null;
                setAvatarUrl(url);
            }
        } else {
             setAvatarUrl(null); // Ensure it's null if no avatar_url
        }
      } catch (err) {
        console.error('Unexpected error fetching avatar:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase, lastRefresh]); // Added lastRefresh dependency

  // Effect to refetch if user changes (e.g., login/logout)
  useEffect(() => {
    setAvatarUrl(null); // Reset on user change before refetch
  }, [user]);


  if (isLoading) {
    return (
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 animate-pulse"
        disabled
      >
        {/* Optional: Add a spinner or placeholder */}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-gray-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
      aria-label="Open user profile"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <UserIcon className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );
};

export default ProfileButton; 