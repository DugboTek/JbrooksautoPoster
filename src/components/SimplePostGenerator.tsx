'use client';

import { useState } from 'react';

interface SimplePostGeneratorProps {
  onSavePost?: (post: string) => void;
}

export default function SimplePostGenerator({ onSavePost }: SimplePostGeneratorProps) {
  const [post, setPost] = useState('');
  
  const handleSave = () => {
    if (onSavePost && post.trim()) {
      onSavePost(post);
      setPost('');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Create LinkedIn Post</h2>
      
      <textarea
        value={post}
        onChange={(e) => setPost(e.target.value)}
        className="w-full h-40 p-3 border border-gray-300 rounded-lg mb-4"
        placeholder="Write your LinkedIn post here..."
      />
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!post.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
        >
          Save Post
        </button>
      </div>
    </div>
  );
} 