"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SimplePostGenerator from '@/components/SimplePostGenerator';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useRouter } from 'next/navigation';

// Define types for our state
interface PostingStates {
  [key: string]: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'posted' | 'failed';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [postingAll, setPostingAll] = useState(false);
  const [postingStates, setPostingStates] = useState<PostingStates>({});
  // Toggle for schedule posts section
  const [showScheduleButtons, setShowScheduleButtons] = useState(false);
  // Toggle for post generator
  const [showPostGenerator, setShowPostGenerator] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isLoading: isAuthLoading } = useSupabase();
  const router = useRouter();
  
  useEffect(() => {
    // Clear any redirect flags
    localStorage.removeItem('pendingRedirect');
    
    // Check if auth is loaded and user is not authenticated
    if (!isAuthLoading && !user) {
      router.push('/login');
      return;
    }
    
    // Auth is loaded and user is authenticated
    if (!isAuthLoading && user) {
      setIsLoading(false);
    }
  }, [isAuthLoading, user, router]);
  
  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Add dummy functions for post handling
  const handlePost = (postId: string) => {
    setPostingStates(prev => ({
      ...prev,
      [postId]: true
    }));
    
    // Simulate posting process
    setTimeout(() => {
      setPostingStates(prev => ({
        ...prev,
        [postId]: false
      }));
    }, 2000);
  };
  
  const handlePostAll = () => {
    setPostingAll(true);
    
    // Simulate posting all process
    setTimeout(() => {
      setPostingAll(false);
    }, 3000);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleScheduleButtons = () => {
    setShowScheduleButtons(prev => !prev);
  };

  const togglePostGenerator = () => {
    setShowPostGenerator(prev => !prev);
  };

  // Handle saving a generated post to the dashboard
  const handleSaveGeneratedPost = (postContent: string) => {
    // In a real implementation, you would make an API call to save the post
    // For now, we're just adding it to the displayPosts array with a simulated ID and timestamp
    
    const newPost: Post = {
      id: `gen-${Date.now()}`,
      title: 'Generated Post',
      content: postContent,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: 'scheduled',
    };
    
    setDisplayPosts([newPost, ...displayPosts]);
    
    // Show a success message (would use a toast in a real implementation)
    alert('Post added to your scheduled posts!');
  };
  
  // Enhanced dummy data for display
  const [displayPosts, setDisplayPosts] = useState<Post[]>([
    { 
      id: '1', 
      title: 'LinkedIn Growth Strategies for 2023', 
      content: 'Discover the top 5 strategies to grow your LinkedIn presence in 2023. Engagement is key to building a strong network and establishing yourself as a thought leader.',
      imageUrl: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?q=80&w=2574&auto=format&fit=crop',
      scheduledDate: '2023-03-15',
      scheduledTime: '09:00 AM',
      status: 'scheduled',
    },
    { 
      id: '2', 
      title: 'How to Write Engaging LinkedIn Posts', 
      content: 'The secret to writing engaging LinkedIn posts is to provide value, be authentic, and encourage conversation. Here are some tips to help you craft the perfect post.',
      scheduledDate: '2023-03-16',
      scheduledTime: '10:30 AM',
      status: 'scheduled',
    },
    { 
      id: '3', 
      title: 'LinkedIn Algorithm: What You Need to Know', 
      content: 'Understanding the LinkedIn algorithm is crucial for maximizing your reach. This post explains how the algorithm works and how you can optimize your content.',
      imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2669&auto=format&fit=crop',
      scheduledDate: '2023-03-17',
      scheduledTime: '02:00 PM',
      status: 'scheduled',
    },
    { 
      id: '4', 
      title: 'Building Your Personal Brand on LinkedIn', 
      content: 'Your personal brand is what sets you apart from others in your industry. Learn how to build a strong personal brand on LinkedIn that attracts opportunities.',
      scheduledDate: '2023-03-18',
      scheduledTime: '11:15 AM',
      status: 'scheduled',
    },
  ]);
  
  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Post Manager</h1>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto py-8 px-4 sm:px-6">
        {/* Developer Controls */}
        <div className="mb-6 bg-gray-100 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <span className="text-sm font-medium text-gray-700">Developer Controls</span>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Show Schedule Buttons</span>
                <button 
                  onClick={toggleScheduleButtons}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    showScheduleButtons ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span 
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showScheduleButtons ? 'translate-x-6' : 'translate-x-1'
                    }`} 
                  />
                </button>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Show Post Generator</span>
                <button 
                  onClick={togglePostGenerator}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    showPostGenerator ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span 
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showPostGenerator ? 'translate-x-6' : 'translate-x-1'
                    }`} 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Post Generator Section */}
          {showPostGenerator && (
            <section className="mb-6">
              <SimplePostGenerator onSavePost={handleSaveGeneratedPost} />
            </section>
          )}

          {/* Posts Section */}
          <section>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => handleTabChange('upcoming')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'upcoming'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upcoming Posts
                </button>
                <button
                  onClick={() => handleTabChange('history')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'history'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Post History
                </button>
              </div>
            </div>

            {/* Create New Post Button */}
            <div className="mb-6">
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                onClick={() => setShowPostGenerator(true)} // Show post generator when clicking this button
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Post
              </button>
            </div>

            {/* Main Content with Sidebar */}
            <div className="flex">
              {/* Left Sidebar - Only visible on upcoming tab and when toggle is enabled */}
              {activeTab === 'upcoming' && showScheduleButtons && (
                <div className="hidden md:block w-[140px] mr-6 flex-shrink-0">
                  <div className="sticky top-4">
                    {/* Schedule All Button */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                      <button
                        onClick={handlePostAll}
                        disabled={postingAll}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="relative w-8 h-8 mb-2">
                          {postingAll ? (
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg 
                              className="w-8 h-8 text-white" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {postingAll ? 'Scheduling...' : 'Schedule All'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Posts Grid */}
              <div className="flex-1">
                <div className="space-y-6">
                  {displayPosts.length > 0 ? (
                    displayPosts.map((post, index) => (
                      <div key={post.id} className="flex items-start">
                        {/* Post Button - Left side of each post - Only visible when toggle is enabled */}
                        {activeTab === 'upcoming' && showScheduleButtons && (
                          <div className="hidden md:block mr-6 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow p-4 w-[140px]">
                              <button
                                onClick={() => handlePost(post.id)}
                                disabled={postingStates[post.id]}
                                className="w-full group relative flex items-center justify-center"
                                aria-label={`Post ${index + 1}`}
                              >
                                <div className="relative w-12 h-12">
                                  {/* Button Background */}
                                  <div className={`
                                    absolute inset-0 rounded-full 
                                    ${postingStates[post.id] 
                                      ? 'bg-blue-100' 
                                      : 'bg-blue-50 group-hover:bg-blue-100 transition-colors'
                                    }
                                  `} />
                                  
                                  {/* Border Ring */}
                                  <div className={`
                                    absolute inset-0 rounded-full border-2
                                    ${postingStates[post.id]
                                      ? 'border-blue-600 border-t-transparent animate-spin'
                                      : 'border-blue-600 group-hover:border-blue-700 transition-colors'
                                    }
                                  `} />
                                  
                                  {/* Icon */}
                                  {postingStates[post.id] ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <svg 
                                        className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors ml-0.5" 
                                        fill="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Post Number Label */}
                                <span className="absolute -right-6 text-xs font-medium text-gray-500">
                                  #{index + 1}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Mobile Post Button - Only visible on small screens and when toggle is enabled */}
                        {activeTab === 'upcoming' && showScheduleButtons && (
                          <div className="md:hidden absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full">
                            <button
                              onClick={() => handlePost(post.id)}
                              disabled={postingStates[post.id]}
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                postingStates[post.id] 
                                  ? 'bg-blue-100' 
                                  : 'bg-blue-50 hover:bg-blue-100'
                              } border-2 ${
                                postingStates[post.id]
                                  ? 'border-blue-600 border-t-transparent animate-spin'
                                  : 'border-blue-600'
                              }`}
                              aria-label={`Post ${index + 1}`}
                            >
                              {postingStates[post.id] ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg 
                                  className="w-5 h-5 text-blue-600 ml-0.5" 
                                  fill="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Post Card */}
                        <div className="bg-white rounded-lg shadow p-4 flex-1 relative">
                          {/* Post Header */}
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {post.scheduledDate} • {post.scheduledTime}
                              </span>
                              <div className="relative group">
                                <button className="p-1 rounded-full hover:bg-gray-100">
                                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Post</button>
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Duplicate Post</button>
                                  <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete Post</button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Post Content */}
                          <p className="text-gray-700 mb-4">{post.content}</p>
                          
                          {/* Post Image (if available) */}
                          {post.imageUrl && (
                            <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                              <Image 
                                src={post.imageUrl} 
                                alt={post.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 500px"
                                className="object-cover"
                                unoptimized={true}
                              />
                            </div>
                          )}
                          
                          {/* Post Status */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                post.status === 'posted' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {post.status === 'scheduled' ? 'Scheduled' :
                                post.status === 'posted' ? 'Posted' : 'Failed'}
                              </span>
                            </div>
                            
                            {/* Edit and Delete buttons */}
                            <div className="flex space-x-2">
                              <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                              <button className="text-sm text-red-500 hover:text-red-700">Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-500 mb-4">Create your first LinkedIn post to get started</p>
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center transition-colors"
                        onClick={() => setShowPostGenerator(true)}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
