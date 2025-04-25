"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import PostGenerator from '@/components/PostGenerator';
import ProfileButton from '@/components/ProfileButton';
import ProfileModal from '@/components/ProfileModal';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/ChevronIcons';
import { Topic } from '@/types/topics';
import { Article } from '@/types/articles';
import { fetchIndustryTopics, fetchArticlesByTopic, generatePostsWithClaude } from '@/services/perplexityApi';

// Import Swiper and required modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';

// Sample trending topics - will be replaced with Perplexity API response
const TRENDING_TOPICS: Topic[] = [
  { id: 'ai', label: 'Artificial Intelligence' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'remote-work', label: 'Remote Work' },
  { id: 'career-development', label: 'Career Development' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'blockchain', label: 'Blockchain' },
  { id: 'marketing', label: 'Digital Marketing' },
  { id: 'startup', label: 'Startup' },
  { id: 'mental-health', label: 'Workplace Mental Health' },
  { id: 'future-of-work', label: 'Future of Work' },
];

// Sample fallback articles
const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'The Future of AI in the Workplace',
    author: 'Jane Smith',
    publication: 'Tech Today',
    summary: 'How artificial intelligence is transforming businesses and redefining job roles across industries.',
    imageUrl: 'https://images.unsplash.com/photo-1677442135968-6db3b0025e95?q=80&w=500&auto=format&fit=crop',
    sourceUrl: 'https://example.com/ai-workplace'
  },
  {
    id: 'a2',
    title: 'Ethics in Artificial Intelligence',
    author: 'John Doe',
    publication: 'AI Review',
    summary: 'Exploring the ethical considerations of AI development and implementation in society.',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=500&auto=format&fit=crop',
    sourceUrl: 'https://example.com/ai-ethics'
  },
];

// Helper function to validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return urlString.startsWith('http://') || urlString.startsWith('https://');
  } catch (e) {
    return false;
  }
};

// Add a useDebounce custom hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<{
    content: string;
    title: string;
    imageUrl?: string;
  } | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showEditingNotification, setShowEditingNotification] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // REMOVED: const [generationPrompt, setGenerationPrompt] = useState('');
  // REMOVED: const [showPromptInput, setShowPromptInput] = useState(false);
  
  // Restore multi-post generation functionality
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  
  // Topic and article selection states
  const [industry, setIndustry] = useState('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topics, setTopics] = useState<Topic[]>(TRENDING_TOPICS);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTopicLabel, setSelectedTopicLabel] = useState('');
  const [isUrlInput, setIsUrlInput] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [urlArticleSummary, setUrlArticleSummary] = useState<{
    title: string;
    summary: string;
    url: string;
  } | null>(null);
  const [isLoadingUrlSummary, setIsLoadingUrlSummary] = useState(false);
  const [urlSummaryError, setUrlSummaryError] = useState<string | null>(null);
  const [topicLoadingStage, setTopicLoadingStage] = useState('Generating topics...');
  const [loadingStage, setLoadingStage] = useState('Searching for articles...');

  const [activeTab, setActiveTab] = useState('upcoming');
  const [postingAll, setPostingAll] = useState(false);
  const [postingStates, setPostingStates] = useState<PostingStates>({});
  // Toggle for schedule posts section
  const [showScheduleButtons, setShowScheduleButtons] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const swiperRef = useRef<any>(null);
  const { user, isLoading: isAuthLoading, signOut, supabase } = useSupabase();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState({ 
    full_name: '', 
    avatar_url: null as string | null,
    job_title: ''
  });
  
  // Debounce search topic for URL inputs
  const debouncedSearchTopic = useDebounce(searchTopic, 800);
  
  // AI editor related states (Copied from PostGenerator)
  const [aiEditText, setAiEditText] = useState('');
  const [isAiEditOpen, setIsAiEditOpen] = useState(false);
  const [isEditingWithAi, setIsEditingWithAi] = useState(false); // Renamed from isGenerating in PostGenerator to avoid conflict
  const [isAnimatingEdit, setIsAnimatingEdit] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [aiEditingStage, setAiEditingStage] = useState('Applying edits...');
  const [modelPreference, setModelPreference] = useState<'fastest' | 'balanced' | 'quality'>('fastest');
  const aiEditPlaceholders = [
    'Make more professional',
    'Remove hashtags',
    'Make it more concise',
    'Add emojis',
    'Sound more enthusiastic',
    'Add a call to action',
    'Make it more personal',
    'Simplify language'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Add auto-resize function for textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to fit all content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Add this effect to rotate through placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % aiEditPlaceholders.length);
    }, 3000); // Change the placeholder every 3 seconds
    
    return () => clearInterval(interval);
  }, [aiEditPlaceholders.length]);

  // Add this effect to cycle through AI editing loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isEditingWithAi) {
      const loadingMessages = [
        'Applying edits...',
        'Refining content...',
        'Enhancing post...',
        'Making improvements...',
        'Optimizing message...',
        'Polishing language...',
        'Updating content...'
      ];
      
      let currentIndex = 0;
      
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setAiEditingStage(loadingMessages[currentIndex]);
      }, 2000); // Change message every 2 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        setAiEditingStage('Applying edits...'); // Reset to default when done
      }
    };
  }, [isEditingWithAi]); // Use the new state variable

  // Add effect to resize textarea whenever content changes
  useEffect(() => {
    if (currentPost?.content) {
      autoResizeTextarea();
    }
  }, [currentPost?.content]);

  // Toggle AI edit panel (Copied from PostGenerator)
  const toggleAiEdit = () => {
    setIsAiEditOpen(!isAiEditOpen);
  };

  // Function to animate the text transition between old and new versions with granular diff visualization (Copied from PostGenerator, adjusted for currentPost)
  const animateTextChange = (oldText: string, newText: string, diff?: {
    added: {text: string, index: number}[];
    removed: {text: string, index: number}[];
    changes?: { type: string, text: string }[];
  }) => {
    setIsAnimatingEdit(true);
    setAnimatedText(oldText);

    // If we have detailed changes, use them for word-level animation
    if (diff?.changes && diff.changes.length > 0) {
      // Start with original text
      let finalText = '';
      let currentText = '';
      let animationSteps: { action: 'add' | 'remove' | 'keep', text: string }[] = [];

      // Process changes to build animation steps
      diff.changes.forEach(change => {
        if (change.type === 'keep') {
          finalText += change.text;
          currentText += change.text;
          animationSteps.push({ action: 'keep', text: change.text });
        } else if (change.type === 'remove') {
          // For removals, we'll animate the text being deleted
          currentText += change.text;
          animationSteps.push({ action: 'remove', text: change.text });
        } else if (change.type === 'add') {
          // For additions, we'll animate the text being added
          finalText += change.text;
          animationSteps.push({ action: 'add', text: change.text });
        }
      });

      // Create a sequence of operations
      const performAnimation = async () => {
        // First set the starting text (with all text that will be removed)
        setAnimatedText(currentText);

        // Wait a moment before starting animation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Process each animation step
        for (let i = 0; i < animationSteps.length; i++) {
          const step = animationSteps[i];

          if (step.action === 'remove') {
            // Animate removal word by word
            const textToRemove = step.text;
            let currentAnimText = currentText;

            // Find position of text to remove
            const removeIndex = currentAnimText.indexOf(textToRemove);
            if (removeIndex >= 0) {
              // Remove the text
              currentText = currentAnimText.substring(0, removeIndex) +
                           currentAnimText.substring(removeIndex + textToRemove.length);

              // Update animation
              setAnimatedText(currentText);

              // Pause briefly after removal
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else if (step.action === 'add') {
            // Animate addition word by word
            const textToAdd = step.text;

            // Find where to add the text (after the previous content)
            const addIndex = currentText.length;

            // Add the text
            currentText = currentText.substring(0, addIndex) + textToAdd;

            // Update animation
            setAnimatedText(currentText);

            // Pause briefly after addition
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }

        // Complete animation
        setAnimatedText(newText);
        setIsAnimatingEdit(false);

        // Update the post
        if (currentPost) {
          setCurrentPost({
            ...currentPost,
            content: newText
          });
        }
      };

      // Start the animation
      performAnimation();
    } else {
      // Fallback to simple animation if no diff is provided
      // Find the common prefix between the two strings
      let commonPrefixLength = 0;
      const minLength = Math.min(oldText.length, newText.length);

      while (commonPrefixLength < minLength &&
             oldText[commonPrefixLength] === newText[commonPrefixLength]) {
        commonPrefixLength++;
      }

      // Calculate what needs to be backspaced and what needs to be typed
      const backspaceLength = oldText.length - commonPrefixLength;
      const newTextToType = newText.substring(commonPrefixLength);

      // Current text state
      let currentText = oldText;
      let backspaceStep = 0;
      let typeStep = 0;

      // Backspace animation
      const backspaceInterval = setInterval(() => {
        if (backspaceStep < backspaceLength) {
          currentText = currentText.slice(0, -1);
          setAnimatedText(currentText);
          backspaceStep++;
        } else {
          clearInterval(backspaceInterval);

          // Start typing animation after backspacing is complete
          const typeInterval = setInterval(() => {
            if (typeStep < newTextToType.length) {
              currentText += newTextToType[typeStep];
              setAnimatedText(currentText);
              typeStep++;
            } else {
              clearInterval(typeInterval);
              setIsAnimatingEdit(false);
              // Update the post
              if (currentPost) {
                setCurrentPost({
                  ...currentPost,
                  content: newText
                });
              }
            }
          }, 25); // Typing speed
        }
      }, 15); // Backspacing speed
    }
  };

  // Handle AI edit submission (Copied from PostGenerator, adjusted for currentPost)
  const handleAiEdit = async () => {
    if (!aiEditText.trim() || !currentPost?.content) return;

    setIsEditingWithAi(true); // Use the new state variable

    try {
      // Call OpenAI API to edit the post
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postContent: currentPost.content,
          editInstruction: aiEditText,
          modelPreference: modelPreference
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.editedPost) {
        throw new Error('No edited content returned from API');
      }

      // Start animation between old text and new text, passing diff if available
      animateTextChange(currentPost.content, data.editedPost, data.diff);

      // Reset the input
      setAiEditText('');

      // Close AI edit panel to make animation more visible
      setIsAiEditOpen(false);
    } catch (error) {
      console.error('Error editing post:', error);
      // Show error message
      alert('Failed to edit post. Please try again.');
    } finally {
      setIsEditingWithAi(false); // Use the new state variable
    }
  };

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
  
  // Fetch user profile when component mounts
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('full_name, job_title, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          // Add cache-busting parameter to avatar URL
          let avatarUrl = data.avatar_url;
          if (avatarUrl && !avatarUrl.includes('?t=')) {
            avatarUrl = `${avatarUrl}?t=${Date.now()}`;
          }
          
          setProfileData({
            full_name: data.full_name || '',
            avatar_url: avatarUrl,
            job_title: data.job_title || ''
          });
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
      }
    }
    
    fetchProfile();
    
    // Add listener for avatar updates
    const handleAvatarUpdate = () => {
      fetchProfile();
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
    };
  }, [user, supabase]);
  
  // Open profile modal handler
  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  // Close profile modal handler
  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Update input type state and handle URL debouncing when searchTopic changes
  useEffect(() => {
    const isUrlType = isValidUrl(searchTopic);
    setIsUrlInput(isUrlType);
    
    if (isUrlType) {
      setSelectedArticle(null);
      setArticles([]);
    } else {
      setUrlArticleSummary(null);
      setIsLoadingUrlSummary(false);
    }
  }, [searchTopic]);
  
  // Handle URL summary fetching with debounce
  useEffect(() => {
    if (isValidUrl(debouncedSearchTopic) && debouncedSearchTopic.length > 10) {
      fetchUrlSummary(debouncedSearchTopic);
    } else if (debouncedSearchTopic !== searchTopic) {
      setUrlArticleSummary(null);
    }
  }, [debouncedSearchTopic]);
  
  // Effect to cycle through loading messages for articles
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isLoadingArticles) {
      const loadingMessages = [
        'Searching for articles...',
        'Finding relevant content...',
        'Reading articles...',
        'Analyzing information...',
        'Summarizing content...',
        'Almost there...'
      ];
      
      let currentIndex = 0;
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setLoadingStage(loadingMessages[currentIndex]);
      }, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        setLoadingStage('Searching for articles...');
      }
    };
  }, [isLoadingArticles]);
  
  // Effect to cycle through topic generation loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isLoadingTopics) {
      const loadingMessages = [
        'Generating topics...',
        'Analyzing industry trends...',
        'Finding relevant topics...',
        'Organizing industry insights...',
        'Curating trending topics...'
      ];
      
      let currentIndex = 0;
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setTopicLoadingStage(loadingMessages[currentIndex]);
      }, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        setTopicLoadingStage('Generating topics...');
      }
    };
  }, [isLoadingTopics]);

  // Generate topics based on industry
  const handleGenerateTopics = async () => {
    if (!industry.trim()) return;
    
    setIsLoadingTopics(true);
    setTopics([]);
    setTopicError(null);
    
    try {
      const newTopics = await fetchIndustryTopics(industry);
      setTopics(newTopics);
    } catch (error: any) {
      console.error('Failed to generate topics:', error);
      
      if (error.message && error.message.includes('API key is missing')) {
        setTopicError('Perplexity API key is missing. Please add it to your environment variables.');
      } else {
        setTopicError('Failed to generate topics. Please try again.');
      }
      
      setTopics(TRENDING_TOPICS);
    } finally {
      setIsLoadingTopics(false);
    }
  };
  
  // Handle topic selection or custom search
  const handleTopicSearch = async (topic: string, isCustomSearch: boolean = false) => {
    setIsLoadingArticles(true);
    setArticleError(null);
    setSelectedTopic(isCustomSearch ? '' : topic);
    setSearchTopic(topic);
    
    if (!isCustomSearch) {
      const selectedTopicObj = topics.find(t => t.id === topic);
      if (selectedTopicObj) {
        setSelectedTopicLabel(selectedTopicObj.label);
      }
    } else {
      setSelectedTopicLabel(topic);
    }
    
    setSelectedArticle(null);
    
    try {
      await fetchArticlesForTopic(topic);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticleError('Failed to load articles. Please try again.');
    } finally {
      setIsLoadingArticles(false);
    }
  };

  // Fetch articles for a given topic
  const fetchArticlesForTopic = async (topicLabel: string) => {
    setIsLoadingArticles(true);
    setArticleError(null);
    setArticles([]);

    try {
      const articlesData = await fetchArticlesByTopic(topicLabel);
      setArticles(articlesData);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      setArticleError('Failed to load articles. Using sample articles instead.');
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setIsLoadingArticles(false);
    }
  };
  
  // Handle article selection
  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    // No longer generating posts automatically when selecting an article
  };
  
  // Generate multiple posts from article
  const generateMultiplePosts = async (article: Article) => {
    if (!article) return;
    
    setIsGenerating(true);
    setGeneratedPosts([]);
    setCurrentPostIndex(0);
    
    try {
      // Call Perplexity API to generate posts using Claude 3.7 Sonnet
      // Using current industry and topic as context if available
      const industryContext = industry || 'Professional';
      const topic = selectedTopicLabel || article.title.split(' ').slice(0, 3).join(' ');
      
      console.log(`Generating posts for article: ${article.title}`);
      console.log(`Using context - Industry: ${industryContext}, Topic: ${topic}`);
      
      // Call the Perplexity API to generate posts
      const posts = await generatePostsWithClaude(article, industryContext, topic);
      
      setGeneratedPosts(posts);
      
      // Set the first post as current - WITHOUT the image
      setCurrentPost({
        title: article.title,
        content: posts[0]
      });
      
      // Show success toast notification
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50';
      successToast.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span><strong>${posts.length} posts</strong> generated! Use the arrows to browse them.</span>
      `;
      document.body.appendChild(successToast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (successToast.parentNode) {
          successToast.parentNode.removeChild(successToast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error generating posts with Perplexity API:', error);
      
      // Fallback to template posts if API call fails
      console.log('Using fallback template posts');
      const fallbackPosts = [
        `I just read this fascinating article: "${article.title}" by ${article.author}. It discusses how ${article.summary.substring(0, 100)}... What are your thoughts on this topic? #ProfessionalDevelopment #Insights`,
        
        `"${article.title}" offers some valuable insights into our industry. One key takeaway: ${article.summary.substring(0, 80)}... Have you experienced something similar in your work? I'd love to hear your perspective.`,
        
        `Worth sharing: ${article.title}\n\nThis piece got me thinking about how we approach ${article.summary.substring(0, 60)}... in our daily work. The implications for our industry could be significant.\n\nWhat's your experience with this?`,
        
        `Quick insights from "${article.title}":\n\n• ${article.summary.substring(0, 40)}...\n• Focus on practical applications\n• Consider the long-term impact\n\nA recommended read for anyone interested in this field!`
      ];
      
      setGeneratedPosts(fallbackPosts);
      
      // Set the first fallback post as current - without image
      setCurrentPost({
        title: article.title,
        content: fallbackPosts[0]
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Navigate to the previous post - define with if check inside
  const handlePreviousPost = () => {
    if (currentPostIndex > 0 && generatedPosts.length > 0) {
      const newIndex = currentPostIndex - 1;
      setCurrentPostIndex(newIndex);
      
      // Update the current post content
      if (currentPost) {
        setCurrentPost({
          ...currentPost,
          content: generatedPosts[newIndex]
        });
      }
    }
  };
  
  // Navigate to the next post - define with if check inside
  const handleNextPost = () => {
    if (currentPostIndex < generatedPosts.length - 1) {
      const newIndex = currentPostIndex + 1;
      setCurrentPostIndex(newIndex);
      
      // Update the current post content
      if (currentPost) {
        setCurrentPost({
          ...currentPost,
          content: generatedPosts[newIndex]
        });
      }
    }
  };
  
  // Open article in a new tab
  const handleOpenArticle = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);
  
  // Fetch article summary for a URL
  const fetchUrlSummary = useCallback(async (url: string) => {
    if (!isValidUrl(url)) return;
    
    setIsLoadingUrlSummary(true);
    setUrlSummaryError(null);
    setUrlArticleSummary(null);

    try {
      // In a real app, this would call your backend API
      // For now, we'll simulate it with a delay and mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockSummary = {
        title: "Simulated Article from URL",
        summary: "This is a simulated summary of the article from the provided URL. In a real application, this would be fetched from the actual URL content using the backend API.",
        url: url
      };
      
      setUrlArticleSummary(mockSummary);
      
      // Also update the current post with this information
      setCurrentPost({
        title: mockSummary.title,
        content: `I just read this interesting article: "${mockSummary.title}".\n\n${mockSummary.summary}\n\nWhat are your thoughts on this topic?`,
      });
    } catch (error: any) {
      console.error('Error fetching URL summary:', error);
      setUrlSummaryError('Failed to load article summary. Please check the URL and try again.');
    } finally {
      setIsLoadingUrlSummary(false);
    }
  }, []);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Use the handlers which have their own condition checks inside
      if (e.key === 'ArrowLeft') {
        handlePreviousPost();
      } else if (e.key === 'ArrowRight') {
        handleNextPost();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // ... existing code ...

  // Fetch saved posts from Supabase
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the posts to match the expected format
      const transformedPosts = data.posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.image_url,
        scheduledDate: post.scheduled_date,
        scheduledTime: post.scheduled_time,
        status: post.status,
        engagement: post.engagement
      }));
      
      setDisplayPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // You might want to show an error notification to the user
    }
  };

  // Add useEffect to fetch posts when component mounts
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Toggle schedule buttons
  const toggleScheduleButtons = () => {
    setShowScheduleButtons(prev => !prev);
  };

  // Scroll articles container using buttons
  const scrollArticles = (direction: 'left' | 'right') => {
    // Find the articles container element
    const articlesContainer = document.querySelector('.flex-grow.overflow-y-auto.max-h-\\[480px\\]');
    
    if (!articlesContainer) return;
    
    // Calculate scroll amount
    const scrollAmount = 300; // Scroll by 300px at a time
    
    // Using explicit equality check to avoid type issues
    if (direction === 'left') {
      articlesContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    } else if (direction === 'right') {
      articlesContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Create a new blank post
  const handleNewPost = () => {
    setCurrentPost({
      content: '',
      title: 'New Post'
    });
  };

  // Handle post title change
  const handlePostTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentPost) {
      setCurrentPost({
        ...currentPost,
        title: e.target.value
      });
    }
  };

  // Handle post content change
  const handlePostContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentPost) {
      setCurrentPost({
        ...currentPost,
        content: e.target.value
      });
    } else {
      setCurrentPost({
        content: e.target.value,
        title: 'New Post'
      });
    }
    
    // Resize textarea on each change
    setTimeout(autoResizeTextarea, 0);
  };

  // Save the current post being edited
  const handleSaveCurrentPost = async () => {
    if (!currentPost || !currentPost.content.trim()) return;
    
    try {
      // Prepare the post data
      const postData = {
        title: currentPost.title || 'New Post',
        content: currentPost.content,
        scheduledDate: new Date().toISOString().split('T')[0], // Today's date
        scheduledTime: new Date().toTimeString().split(' ')[0].substring(0, 5), // Current time
        status: 'scheduled'
      };
      
      // Send the post to the API
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save post: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the saved post to the display posts with the returned ID
      setDisplayPosts([{
        id: data.post.id,
        title: data.post.title,
        content: data.post.content,
        imageUrl: data.post.image_url,
        scheduledDate: data.post.scheduled_date,
        scheduledTime: data.post.scheduled_time,
        status: data.post.status,
        engagement: data.post.engagement
      }, ...displayPosts]);
      
      setCurrentPost(null);
      
      // Show success notification
      setShowSuccessNotification(true);
      
      // Hide notification after 2 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving post:', error);
      // Show error notification to user
      alert('Failed to save post. Please try again.');
    }
  };

  // Function to handle posting all scheduled posts
  const handlePostAll = async () => {
    if (postingAll) return;
    
    setPostingAll(true);
    try {
      // Loop through all display posts with scheduled status
      const scheduledPosts = displayPosts.filter(post => post.status === 'scheduled');
      
      for (const post of scheduledPosts) {
        // Update individual post state
        setPostingStates(prev => ({ ...prev, [post.id]: true }));
        
        // Simulate API call to post to LinkedIn
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update post status
        const updatedPosts = displayPosts.map(p => {
          if (p.id === post.id) {
            return { ...p, status: 'posted' as const };
          }
          return p;
        });
        
        setDisplayPosts(updatedPosts as Post[]);
        
        // Reset individual post state
        setPostingStates(prev => ({ ...prev, [post.id]: false }));
      }
    } catch (error) {
      console.error('Error posting all:', error);
    } finally {
      setPostingAll(false);
    }
  };

  // Function to handle posting a single post
  const handlePost = async (postId: string) => {
    if (postingStates[postId]) return;
    
    setPostingStates(prev => ({ ...prev, [postId]: true }));
    
    try {
      // Simulate API call to post to LinkedIn
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update post status in the UI
      const updatedPosts = displayPosts.map(post => {
        if (post.id === postId) {
          return { ...post, status: 'posted' as const };
        }
        return post;
      });
      
      setDisplayPosts(updatedPosts as Post[]);
    } catch (error) {
      console.error('Error posting:', error);
      // Update to failed status if there's an error
      const updatedPosts = displayPosts.map(post => {
        if (post.id === postId) {
          return { ...post, status: 'failed' as const };
        }
        return post;
      });
      
      setDisplayPosts(updatedPosts as Post[]);
    } finally {
      setPostingStates(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Function to handle editing a post
  const handleEditPost = (post: Post) => {
    setCurrentPost({
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl
    });
    
    // Scroll to editor
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show editing notification
    setShowEditingNotification(true);
    
    // Hide notification after 2 seconds
    setTimeout(() => {
      setShowEditingNotification(false);
    }, 2000);
  };

  // Function to handle deleting a post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      // Call API to delete post
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }
      
      // Remove post from UI
      setDisplayPosts(displayPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Post Manager</h1>
          <div className="flex items-center space-x-4">
            <ProfileButton onClick={handleOpenProfileModal} />
            <button 
              onClick={signOut} 
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6">
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
              {/* Remove post generator toggle */}
            </div>
          </div>
        </div>

        {/* Content Layout: Reorganized for better use of space */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Content Layout: Reorganized for better use of space */}
          <section className="w-full">
            {/* Combined Article Search & Preview Area */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              {/* Left Column: Combined Find Articles & Articles Display */}
              <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col gap-4">
                {/* Find Articles Box - Combined with Articles */}
                <div className="bg-white rounded-xl shadow overflow-hidden h-full flex flex-col">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Find & Browse Articles</h3>
                  </div>
                  
                  <div className="p-4 border-b border-gray-100">
                    {/* Industry Input */}
                    <div className="flex flex-col space-y-2 mb-4">
                      <label htmlFor="industry-input" className="text-sm font-medium text-gray-700">
                        What's your industry?
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="industry-input"
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g., Healthcare, Technology, Finance"
                          className="flex-1 border p-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && industry.trim()) {
                              handleGenerateTopics();
                            }
                          }}
                        />
                        <button
                          onClick={handleGenerateTopics}
                          disabled={!industry.trim() || isLoadingTopics}
                          className="whitespace-nowrap px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isLoadingTopics ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {topicLoadingStage}
                            </>
                          ) : (
                            'Generate Topics'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Topic Search */}
                    <div className="mb-3">
                      <label htmlFor="topicOrUrl" className="text-sm font-medium text-gray-700 block mb-1">
                        Enter Topic or Article URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="topicOrUrl"
                          type="text"
                          value={searchTopic}
                          onChange={(e) => setSearchTopic(e.target.value)}
                          placeholder="e.g., 'Future of AI' or 'https://example.com/article'"
                          className="flex-1 border p-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && searchTopic.trim()) {
                              if (!isUrlInput) {
                                handleTopicSearch(searchTopic.trim(), true);
                              } else if (urlArticleSummary) {
                                setCurrentPost({
                                  title: urlArticleSummary.title,
                                  content: `I just read this interesting article: "${urlArticleSummary.title}".\n\n${urlArticleSummary.summary}\n\nWhat are your thoughts on this topic?`,
                                });
                              }
                            }
                          }}
                        />
                        {!isUrlInput && (
                          <button
                            onClick={() => handleTopicSearch(searchTopic.trim(), true)}
                            disabled={!searchTopic.trim() || isLoadingArticles}
                            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            aria-label="Search Topic"
                          >
                            {isLoadingArticles ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Searching...</span>
                              </>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Error Messages */}
                    {topicError && (
                      <div className="mb-3 text-sm text-red-500">
                        {topicError}
                      </div>
                    )}

                    {/* Topic Pills Section */}
                    {!isUrlInput && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {isLoadingTopics ? (
                            // Skeleton loading for topics
                            Array(6).fill(0).map((_, index) => (
                              <div
                                key={index}
                                className="px-3 py-1 rounded-full bg-gray-200 animate-pulse w-24 h-7"
                              ></div>
                            ))
                          ) : topics.length > 0 ? (
                            // Rendered topics
                            topics.map(topic => (
                              <button
                                key={topic.id}
                                onClick={() => handleTopicSearch(topic.label, false)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  selectedTopicLabel === topic.label
                                    ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {topic.label}
                              </button>
                            ))
                          ) : (
                            !industry && <p className="text-gray-500 italic text-xs">Enter your industry and click "Generate Topics" to see relevant trending topics.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* URL Article Preview */}
                    {isUrlInput && (
                      <div>
                        {isLoadingUrlSummary ? (
                          <div className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                            </div>
                          </div>
                        ) : urlArticleSummary ? (
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <h3 className="text-sm font-semibold text-gray-800 mb-1">{urlArticleSummary.title}</h3>
                            <div className="text-xs text-gray-600 mb-2">{urlArticleSummary.summary}</div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <a href={urlArticleSummary.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {urlArticleSummary.url.length > 40 ? urlArticleSummary.url.substring(0, 40) + '...' : urlArticleSummary.url}
                              </a>
                            </div>
                          </div>
                        ) : urlSummaryError ? (
                          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{urlSummaryError}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Articles Display */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Articles</h3>
                        <div className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center">
                          <span className="mr-1">1</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                          <span className="ml-1">Select</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500 hidden md:inline-flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                          Scroll to browse
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => scrollArticles('left')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-100"
                            aria-label="Scroll up"
                          >
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => scrollArticles('right')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-100"
                            aria-label="Scroll down"
                          >
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Articles Container with vertical scrolling for more articles */}
                  <div className="p-4 relative flex-grow overflow-y-auto min-h-[400px] max-h-[600px]">
                    {/* Loading state for articles */}
                    {isLoadingArticles && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="mt-2 text-sm font-medium text-gray-600">{loadingStage}</p>
                        </div>
                      </div>
                    )}
                    
                    {articles.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {articles.map((article) => (
                          <div 
                            key={article.id}
                            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-lg ${
                              selectedArticle?.id === article.id 
                                ? 'border-blue-300 bg-blue-50 shadow ring-2 ring-blue-200' 
                                : 'border-gray-100 hover:border-blue-100 shadow-sm'
                            }`}
                            onClick={() => handleSelectArticle(article)}
                          >
                            <div className="flex gap-4">
                              <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden">
                                <Image
                                  src={article.imageUrl}
                                  alt={article.title}
                                  fill
                                  className="object-cover"
                                  unoptimized={true}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight">{article.title}</h4>
                                <p className="text-sm text-gray-500 mb-1 line-clamp-1 flex items-center">
                                  <span className="inline-block mr-2 w-5 h-5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0"></span>
                                  {article.author} • {article.publication}
                                </p>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">{article.summary}</p>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenArticle(article.sourceUrl);
                                  }}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Read Original
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : articleError ? (
                      <div className="p-6 bg-red-50 rounded-lg text-center">
                        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-base font-medium text-red-600 mb-1">{articleError}</p>
                        <p className="text-sm text-red-500">Try another topic or check your connection</p>
                      </div>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-700 mb-2">No articles yet</p>
                        <p className="text-base text-gray-500 max-w-xs mx-auto">Select a topic from above to browse related articles</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Article Preview - Now with more width */}
              {selectedArticle ? (
                <div className="w-full lg:w-1/2 xl:w-7/12 h-full">
                  <div className="bg-white rounded-xl shadow overflow-hidden h-full flex flex-col min-h-[400px] max-h-[calc(100vh-200px)] relative">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Article Preview</h3>
                        <div className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center">
                          <span className="mr-1">2</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                          <span className="ml-1">Generate</span>
                        </div>
                      </div>
                      
                      {/* Redesigned Generate Posts Button - Desktop version */}
                      <button
                        onClick={() => generateMultiplePosts(selectedArticle)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-150 ease-in-out shadow-sm hover:shadow"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Generate Posts</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Redesigned Floating Generate Button - Mobile version */}
                    <button
                      onClick={() => generateMultiplePosts(selectedArticle)}
                      disabled={isGenerating}
                      className="fixed md:absolute bottom-6 right-6 z-30 flex items-center justify-center w-auto md:w-auto px-4 py-2 md:py-2 rounded-full md:rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      aria-label="Generate Posts"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden md:inline">Generating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="hidden md:inline">Generate Posts</span>
                        </div>
                      )}
                    </button>
                    
                    <div className="p-8 overflow-y-auto flex-grow">
                      <h4 className="text-2xl font-semibold text-gray-900 mb-5 leading-tight">{selectedArticle.title}</h4>
                      
                      <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={selectedArticle.imageUrl}
                          alt={selectedArticle.title}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-6">
                        <span className="inline-block mr-2 w-6 h-6 bg-gray-200 rounded-full overflow-hidden flex-shrink-0"></span>
                        <span className="font-medium">{selectedArticle.author}</span>
                        <span className="mx-2">•</span>
                        <span>{selectedArticle.publication}</span>
                      </div>
                      
                      <div className="text-gray-600 text-base mb-8 leading-relaxed space-y-4">
                        {selectedArticle.summary.split(/(?<=\. )/).map((paragraph, index) => (
                          paragraph.trim() && <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      
                      <div className="flex justify-between mt-auto pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => handleOpenArticle(selectedArticle.sourceUrl)}
                          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Read Full Article
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full lg:w-1/2 xl:w-7/12 h-full hidden lg:block">
                  <div className="bg-white rounded-xl shadow overflow-hidden h-full flex items-center justify-center min-h-[400px] max-h-[calc(100vh-200px)]">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-800 mb-3">No Article Selected</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">Click on an article card to view its details and generate LinkedIn posts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Post Editor - Moved Below Article Area */}
            <section className="w-full post-editor-section" ref={editorRef}>
              <div className={`bg-white rounded-xl shadow overflow-hidden ${showEditingNotification ? 'ring-2 ring-blue-500 transition-shadow duration-300' : ''}`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">
                      {currentPost?.content ? (currentPost.title === 'New Post' ? 'Create a Post' : 'Edit Post') : 'Create a Post'}
                    </h2>
                    <div className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center">
                      <span className="mr-1">3</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="ml-1">Publish</span>
                    </div>
                  </div>
                  
                  {/* Enhanced Post Navigation */}
                  {generatedPosts.length > 1 && (
                    <div className="flex flex-col items-end">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-1">
                        <span className="text-sm text-blue-700 font-medium">
                          {generatedPosts.length} posts generated!
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <button
                          onClick={handlePreviousPost}
                          disabled={currentPostIndex === 0}
                          className={`p-2 rounded-md ${
                            currentPostIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          aria-label="Previous post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span className="sr-only">Previous (Left Arrow)</span>
                        </button>
                        
                        {/* Post Indicators */}
                        <div className="flex space-x-1 px-2">
                          {generatedPosts.map((_, idx) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                setCurrentPostIndex(idx);
                                setCurrentPost(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    content: generatedPosts[idx]
                                  };
                                });
                              }}
                              className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                                idx === currentPostIndex
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={handleNextPost}
                          disabled={currentPostIndex === generatedPosts.length - 1}
                          className={`p-2 rounded-md ${
                            currentPostIndex === generatedPosts.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          aria-label="Next post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="sr-only">Next (Right Arrow)</span>
                        </button>
                      </div>
                      
                      {/* Keyboard shortcut hint */}
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                        <span className="mr-1">Navigate with</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded text-gray-600 font-mono text-xs mr-1">←</kbd>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded text-gray-600 font-mono text-xs">→</kbd>
                      </div>
                    </div>
                  )}
                  
                  {showEditingNotification && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Editing mode
                    </span>
                  )}
                </div>
                
                <div className="p-4">
                  {/* LinkedIn-style post editor */}
                  <div className="flex space-x-3">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {profileData.avatar_url ? (
                        <Image 
                          src={profileData.avatar_url} 
                          alt={profileData.full_name} 
                          width={48} 
                          height={48} 
                          className="rounded-full border border-gray-200"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Post Content Area */}
                    <div className="flex-1 space-y-4">
                      {/* AI Prompt Input (conditionally shown) - REMOVE THIS BLOCK */}
                      {/* {showPromptInput && ( ... )} */}

                      {/* Input Fields */}
                      <div>
                        <input
                          type="text"
                          value={currentPost?.title || ''}
                          onChange={handlePostTitleChange}
                          className="w-full text-lg font-medium px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-blue-500"
                          placeholder="Add a title..."
                          onClick={() => {
                            if (!currentPost) {
                              handleNewPost();
                            }
                          }}
                        />
                        
                        {/* Post Content Area with Navigation Indicators */}
                        <div className="relative">
                          {generatedPosts.length > 1 && (
                            <div className="absolute -top-1 left-0 right-0 flex justify-center">
                              <div className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-b-lg border border-blue-100 border-t-0">
                                Post {currentPostIndex + 1} of {generatedPosts.length}
                              </div>
                            </div>
                          )}
                          
                          {isAnimatingEdit ? (
                            // Animating edits - show with typing effect
                            <div className="min-h-[120px] whitespace-pre-wrap break-words border border-gray-200 rounded-md p-3 mt-2">
                              {animatedText.split('\n').map((line, i, arr) => (
                                <div key={i} className="relative leading-relaxed">
                                  <span className="fade-in text-gray-900">{line}</span>
                                  {i < arr.length - 1 && <br />}
                                </div>
                              ))}
                              <span className="typing-cursor"></span>
                            </div>
                          ) : (
                            // Normal textarea view
                            <textarea
                              ref={textareaRef}
                              value={currentPost?.content || ''}
                              onChange={handlePostContentChange}
                              className={`w-full mt-2 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[120px] overflow-hidden ${
                                generatedPosts.length > 1 ? 'pt-6' : ''
                              }`}
                              placeholder="What do you want to talk about?"
                              onClick={() => {
                                if (!currentPost) {
                                  handleNewPost();
                                }
                              }}
                            />
                          )}
                          
                          {/* AI Edit panel */}
                          {isAiEditOpen && (
                            <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg space-y-2 mt-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={aiEditText}
                                  onChange={(e) => setAiEditText(e.target.value)}
                                  placeholder={`${aiEditPlaceholders[placeholderIndex]}...`}
                                  className="flex-1 text-sm border border-indigo-200 p-2 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && aiEditText.trim()) {
                                      handleAiEdit();
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleAiEdit}
                                  disabled={!aiEditText.trim() || isEditingWithAi}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  {isEditingWithAi ? ( // Use new state variable
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>{aiEditingStage}</span>
                                    </> 
                                  ) : (
                                    <>
                                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                      </svg>
                                      <span>Edit with AI</span>
                                    </> 
                                  )}
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-indigo-600">
                                  <svg className="h-3 w-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Try: "Add a call to action", "Remove hashtags", "Make more professional"
                                </div>
                                <div className="flex text-xs space-x-1 items-center">
                                  <span className="text-gray-600">Model:</span>
                                  <div className="flex border border-indigo-200 rounded-md overflow-hidden">
                                    <button 
                                      onClick={() => setModelPreference('fastest')}
                                      className={`px-2 py-0.5 text-xs ${
                                        modelPreference === 'fastest'
                                          ? 'bg-indigo-600 text-white'
                                          : 'text-indigo-600 hover:bg-indigo-50'
                                      }`}
                                    >
                                      Fastest
                                    </button>
                                    <button 
                                      onClick={() => setModelPreference('balanced')}
                                      className={`px-2 py-0.5 text-xs ${
                                        modelPreference === 'balanced'
                                          ? 'bg-indigo-600 text-white'
                                          : 'text-indigo-600 hover:bg-indigo-50'
                                      }`}
                                    >
                                      Balanced
                                    </button>
                                    <button 
                                      onClick={() => setModelPreference('quality')}
                                      className={`px-2 py-0.5 text-xs ${
                                        modelPreference === 'quality'
                                          ? 'bg-indigo-600 text-white'
                                          : 'text-indigo-600 hover:bg-indigo-50'
                                      }`}
                                    >
                                      Quality
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Preview (if any) */}
                      {currentPost?.imageUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200">
                          <div className="relative h-64 w-full">
                            <Image 
                              src={currentPost.imageUrl} 
                              alt={currentPost.title || 'Post image'}
                              fill
                              sizes="(max-width: 768px) 100vw, 500px"
                              className="object-cover"
                              unoptimized={true}
                            />
                          </div>
                          <button 
                            className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-1"
                            onClick={() => setCurrentPost({...currentPost, imageUrl: undefined})}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      {/* Loading state during generation */}
                      {isGenerating && (
                        <div className="flex items-center justify-center py-10">
                          <div className="animate-pulse flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">Generating your post...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex space-x-2">
                          {/* Image Upload */}
                          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          
                          {/* Video Upload */}
                          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          
                          {/* AI Generate */}
                          <button 
                            className={`p-2 rounded-full transition-colors ${
                              isAiEditOpen ? 'bg-indigo-100 text-indigo-700' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                            onClick={toggleAiEdit} // <-- Corrected: Use toggleAiEdit
                            title="Edit with AI"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </button>
                        </div>
                        
                        <div>
                          <button 
                            onClick={handleSaveCurrentPost}
                            disabled={!currentPost || !currentPost.content.trim()}
                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              currentPost && currentPost.content.trim() 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>

          {/* Posts Section */}
        <div className="mt-8">
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
                onClick={handleNewPost} // Create a new post directly
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

                        {/* Post Card - Right side */}
                        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
                          {/* Post header with profile */}
                          <div className="flex items-center p-4 border-b border-gray-100">
                            <div className="flex-shrink-0 mr-3">
                              {profileData.avatar_url ? (
                                <Image 
                                  src={profileData.avatar_url} 
                                  alt={profileData.full_name} 
                                  width={36} 
                                  height={36} 
                                  className="rounded-full border border-gray-200"
                                  unoptimized={true}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{profileData.full_name || 'Your Name'}</h4>
                                  <p className="text-xs text-gray-500">{profileData.job_title || 'Your Title'}</p>
                                </div>
                                
                                {/* Schedule info */}
                                <div className="text-sm text-gray-500">
                                  {post.scheduledDate} • {post.scheduledTime}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Post content */}
                          <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
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
                                <button 
                                  className="text-sm text-gray-500 hover:text-gray-700"
                                  onClick={() => handleEditPost(post)}
                                >
                                  Edit
                                </button>
                                <button className="text-sm text-red-500 hover:text-red-700" onClick={() => handleDeletePost(post.id)}>Delete</button>
                              </div>
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
                        onClick={handleNewPost}
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

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
      />
      
      {/* Success Notification Modal */}
      {showSuccessNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-10 transform transition-all animate-fadeInOut">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Post Scheduled</h3>
                <p className="text-sm text-gray-500">Your post has been added to scheduled posts</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Editing Notification */}
      {showEditingNotification && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeInOut flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Post loaded for editing</span>
          </div>
        </div>
      )}

      {/* Add CSS for typing animation (Copied from PostGenerator) */}
      <style jsx>{`
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: #000;
          margin-left: 2px;
          animation: blink 0.7s infinite;
          vertical-align: middle;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .fade-in {
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }

        /* Animation for AI Edit Panel (Optional: Add if needed) */
        .ai-edit-panel-enter {
          opacity: 0;
          transform: translateY(10px);
        }
        .ai-edit-panel-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms, transform 300ms;
        }
        .ai-edit-panel-exit {
          opacity: 1;
          transform: translateY(0);
        }
        .ai-edit-panel-exit-active {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 300ms, transform 300ms;
        }
      `}</style>
    </div>
  )
}
