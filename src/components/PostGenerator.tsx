"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import Image from 'next/image';
import profilePic from '../soladugbo.jpg';
import { Topic } from '@/types/topics';
import { Article } from '@/types/articles';
import { fetchIndustryTopics, fetchArticlesByTopic } from '@/services/perplexityApi';
import { useSupabase } from '@/components/providers/supabase-provider';
import { UserCircleIcon } from '@heroicons/react/24/outline';

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

// Sample article for fallback - These will be fetched from Perplexity API
const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'The Future of AI in the Workplace',
    author: 'Jane Smith',
    publication: 'Tech Today',
    summary: 'How artificial intelligence is transforming businesses and redefining job roles across industries. Companies are increasingly relying on AI to automate routine tasks, analyze large datasets, and provide insights that were previously impossible to obtain. This trend is expected to continue as AI technologies become more sophisticated and accessible.\n\nAt the same time, concerns about job displacement and ethical implications of AI implementation remain significant. Organizations must carefully balance technological advancement with workforce needs and societal impacts. Training and reskilling programs are becoming essential to help employees adapt to changing job requirements in an AI-driven workplace.',
    imageUrl: 'https://images.unsplash.com/photo-1677442135968-6db3b0025e95?q=80&w=500&auto=format&fit=crop',
    sourceUrl: 'https://example.com/ai-workplace'
  },
  // ... more fallback articles can be added
];

// Sample articles - These would be fetched from an API based on the selected topic
const SAMPLE_ARTICLES = {
  'ai': [
    {
      id: 'a1',
      title: 'The Future of AI in the Workplace',
      summary: 'How artificial intelligence is transforming businesses and redefining job roles across industries.',
      imageUrl: 'https://images.unsplash.com/photo-1677442135968-6db3b0025e95?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/ai-workplace'
    },
    {
      id: 'a2',
      title: 'Ethics in Artificial Intelligence',
      summary: 'Exploring the ethical considerations of AI development and implementation in society.',
      imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/ai-ethics'
    },
    {
      id: 'a3',
      title: 'AI and Data Privacy Concerns',
      summary: 'How companies are balancing innovation with data protection in the age of advanced AI.',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/ai-privacy'
    },
    {
      id: 'a4',
      title: 'Machine Learning Breakthroughs',
      summary: 'Recent advancements in machine learning algorithms and their practical applications.',
      imageUrl: 'https://images.unsplash.com/photo-1488229297570-58520851e868?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/machine-learning'
    }
  ],
  'leadership': [
    {
      id: 'l1',
      title: 'Effective Leadership in Remote Teams',
      summary: 'Strategies for leading distributed teams and maintaining company culture virtually.',
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/remote-leadership'
    },
    {
      id: 'l2',
      title: 'Transformational Leadership',
      summary: 'How transformational leaders inspire and motivate their teams to achieve exceptional results.',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/transformational-leadership'
    },
    {
      id: 'l3',
      title: 'Inclusive Leadership Practices',
      summary: 'Building diverse and inclusive teams through empathetic and equitable leadership.',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/inclusive-leadership'
    }
  ],
  'productivity': [
    {
      id: 'p1',
      title: 'Deep Work: Rules for Focused Success',
      summary: 'How to cultivate deep work habits for radically improved productivity in a distracted world.',
      imageUrl: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/deep-work'
    },
    {
      id: 'p2',
      title: 'The Pomodoro Technique',
      summary: 'Using time-blocking strategies to maximize focus and productivity throughout the workday.',
      imageUrl: 'https://images.unsplash.com/photo-1514474959185-1472d4c4e0d4?q=80&w=500&auto=format&fit=crop',
      sourceUrl: 'https://example.com/pomodoro'
    }
  ]
};

// Sample fallback generated posts - These would be generated via API call in the real implementation
const FALLBACK_GENERATED_POSTS = [
  "I recently read an insightful article about the impact of AI on the job market. Key takeaway: While AI will automate certain tasks, it's also creating new roles that require human creativity and emotional intelligence. Are you preparing your skillset for this shift? #AI #FutureOfWork #CareerDevelopment",
  
  "Just finished this fascinating piece on artificial intelligence. The author argues that AI won't replace humans but rather augment our capabilities. I particularly agree with the point about AI handling routine tasks while humans focus on creative problem-solving. What's your take on AI in your industry? #ArtificialIntelligence #Innovation",
  
  "According to this article, 65% of children entering primary school today will ultimately end up working in job types that don't even exist yet. This statistic really highlights the importance of adaptability and continuous learning in our rapidly evolving economy. How are you staying ahead of the curve? #FutureSkills #LifelongLearning",
  
  "The article makes a compelling case that AI adoption isn't just about technology implementation but requires a complete rethinking of business processes. This resonates with my experience leading digital transformation initiatives. The human element remains crucial in any tech adoption. What challenges have you faced? #DigitalTransformation #ChangeManagement"
];

interface PostGeneratorProps {
  onSavePost?: (post: string) => void;
}

// Helper function to validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    // Basic check for protocol and domain, might need refinement
    return urlString.startsWith('http://') || urlString.startsWith('https://');
  } catch (e) {
    return false;
  }
};

// Add a useDebounce custom hook at the beginning of the file, after imports
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

export default function PostGenerator({ onSavePost }: PostGeneratorProps) {
  // Industry state
  const [industry, setIndustry] = useState('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topics, setTopics] = useState<Topic[]>(TRENDING_TOPICS);
  const [error, setError] = useState<string | null>(null);
  const [topicLoadingStage, setTopicLoadingStage] = useState('Generating topics...');
  
  // Form state
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTopicLabel, setSelectedTopicLabel] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useClaudeStyle, setUseClaudeStyle] = useState(true); // Default to Claude-style generation
  const [isUrlInput, setIsUrlInput] = useState(false); // State to track input type
  
  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('Searching for articles...');
  
  // Generated posts state
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [editedPost, setEditedPost] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [generatingStage, setGeneratingStage] = useState('Generating Posts...');
  
  // History tracking for undo/redo
  const [postHistory, setPostHistory] = useState<string[][]>([]);
  const [currentPostHistory, setCurrentPostHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  
  // AI editor related states
  const [aiEditText, setAiEditText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [aiEditingStage, setAiEditingStage] = useState('Applying edits...');
  const [isAiEditOpen, setIsAiEditOpen] = useState(false);
  const [isAnimatingEdit, setIsAnimatingEdit] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
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
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const swiperRef = useRef<any>(null);
  
  // Supabase
  const { supabase, user } = useSupabase();
  const [profileData, setProfileData] = useState<{ full_name: string | null; job_title: string | null; avatar_url: string | null }>({
    full_name: null,
    job_title: null,
    avatar_url: null
  });
  
  // At the top of the file, add a new state for storing article summaries from URLs
  const [urlArticleSummary, setUrlArticleSummary] = useState<{
    title: string;
    summary: string;
    url: string;
  } | null>(null);
  const [isLoadingUrlSummary, setIsLoadingUrlSummary] = useState(false);
  const [urlSummaryError, setUrlSummaryError] = useState<string | null>(null);
  
  // Update input type state and handle URL debouncing when searchTopic changes
  const debouncedSearchTopic = useDebounce(searchTopic, 800); // 800ms debounce delay

  // This effect detects when input is a URL and clears article selection if needed
  useEffect(() => {
    const isUrlType = isValidUrl(searchTopic);
    setIsUrlInput(isUrlType);
    
    // Reset selected article if input changes and it's not a topic anymore or topic doesn't match
    if (isUrlType) {
      setSelectedArticle(null);
      setArticles([]); // Clear articles if URL is entered
    } else {
      // Clear URL summary if input is not a URL
      setUrlArticleSummary(null);
      setIsLoadingUrlSummary(false);
    }
  }, [searchTopic]);
  
  // This effect handles the debounced URL summary fetching
  useEffect(() => {
    // Only fetch if the debounced value is a valid URL
    if (isValidUrl(debouncedSearchTopic) && debouncedSearchTopic.length > 10) {
      console.log(`Debounced URL fetch triggered for: ${debouncedSearchTopic}`);
      fetchUrlSummary(debouncedSearchTopic);
    } else if (debouncedSearchTopic !== searchTopic) {
      // Clear URL summary if debounced value is not valid 
      // and is different from current value (prevents clearing on initial render)
      setUrlArticleSummary(null);
    }
  }, [debouncedSearchTopic]);
  
  // Fetch profile data when component mounts
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
          // Add a cache-busting timestamp to avatar URL
          let avatarUrl = data.avatar_url;
          if (avatarUrl && !avatarUrl.includes('?t=')) {
            avatarUrl = `${avatarUrl}?t=${Date.now()}`;
          }
          
          setProfileData({
            full_name: data.full_name || 'Your Name',
            job_title: data.job_title || 'Your Title',
            avatar_url: avatarUrl
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
  
  // Handle topic selection or custom search
  const handleTopicSearch = async (topic: string, isCustomSearch: boolean = false) => {
    setIsLoadingArticles(true); // Set loading state immediately
    setArticleError(null); // Clear any previous errors
    setSelectedTopic(isCustomSearch ? '' : topic);
    setSearchTopic(topic);
    
    // Get the topic label for predefined topics
    if (!isCustomSearch) {
      const selectedTopicObj = topics.find(t => t.id === topic);
      if (selectedTopicObj) {
        setSelectedTopicLabel(selectedTopicObj.label);
      }
    } else {
      setSelectedTopicLabel(topic);
    }
    
    setSelectedArticle(null);
    setGeneratedPosts([]);
    
    try {
      // Fetch articles based on the topic
      await fetchArticlesForTopic(topic);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticleError('Failed to load articles. Please try again.');
    } finally {
      setIsLoadingArticles(false); // Ensure loading state is cleared
    }
  };

  // Fetch articles for a given topic
  const fetchArticlesForTopic = async (topicLabel: string) => {
    setIsLoadingArticles(true);
    setArticleError(null);
    setArticles([]); // Clear existing articles

    try {
      console.log(`Fetching articles for topic: ${topicLabel}`);
      const articlesData = await fetchArticlesByTopic(topicLabel);
      console.log(`Received ${articlesData.length} articles:`, articlesData);
      setArticles(articlesData);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      setArticleError('Failed to load articles. Using sample articles instead.');
      
      // Fallback to sample articles
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setIsLoadingArticles(false);
    }
  };
  
  // Handle article selection
  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setGeneratedPosts([]);
  };
  
  // Open article in a new tab
  const handleOpenArticle = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // Handle form submission to generate posts
  const handleGeneratePosts = async () => {
    if (!searchTopic) return; // Don't generate if input is empty

    setIsGenerating(true);
    setGeneratedPosts([]); // Clear previous posts
    setCurrentPostIndex(0);
    setEditedPost('');

    const inputType = isUrlInput ? 'url' : 'topic';

    try {
      let requestBody: any;

      if (inputType === 'url') {
        requestBody = { input: searchTopic, inputType: 'url' };
      } else {
        // If it's a topic, ensure an article is selected
        if (!selectedArticle) {
          console.error("Topic input detected, but no article selected.");
          // Maybe show a user message here instead of just logging
          setIsGenerating(false);
          return; // Stop generation if no article selected for a topic
        }
        requestBody = {
          input: selectedArticle, // Send the whole article object for context
          inputType: 'topic',
          industry: industry || 'Professional',
          topicLabel: selectedTopicLabel || 'Business'
        };
      }

      // --- Backend API Call ---
      console.log('Calling backend API /api/generate-posts with body:', requestBody);
      const response = await fetch('/api/generate-posts', { // TODO: Create this API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch errors if response is not JSON
        console.error('API Error:', response.status, errorData);
        throw new Error(`API request failed: ${response.status}`);
      }

      const posts = await response.json();
      // --- End Backend API Call ---

      if (!posts || posts.length === 0) {
          console.warn("API returned no posts, using fallbacks.");
          setGeneratedPosts(FALLBACK_GENERATED_POSTS);
          setCurrentPostIndex(0);
          setEditedPost(FALLBACK_GENERATED_POSTS[0]);
      } else {
          setGeneratedPosts(posts);
          setCurrentPostIndex(0);
          setEditedPost(posts[0]);
      }

    } catch (error) {
      console.error('Failed to generate posts:', error);
      // Use fallback posts if generation fails
      setGeneratedPosts(FALLBACK_GENERATED_POSTS);
      setCurrentPostIndex(0);
      setEditedPost(FALLBACK_GENERATED_POSTS[0]);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Navigate to the previous post
  const handlePreviousPost = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(prev => prev - 1);
    }
  };
  
  // Navigate to the next post
  const handleNextPost = () => {
    if (currentPostIndex < generatedPosts.length - 1) {
      setCurrentPostIndex(prev => prev + 1);
    }
  };
  
  // Scroll articles container using buttons
  const scrollArticles = (direction: 'left' | 'right') => {
    if (!swiperRef.current) return;
    
    if (direction === 'left') {
      swiperRef.current.slidePrev();
    } else {
      swiperRef.current.slideNext();
    }
  };
  
  // Start editing the current post
  const handleStartEditing = () => {
    setIsEditing(true);
    setEditedPost(generatedPosts[currentPostIndex]);
    
    // Focus on the textarea when editing starts
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };
  
  // Toggle AI edit panel
  const toggleAiEdit = () => {
    setIsAiEditOpen(!isAiEditOpen);
  };
  
  // Update post history when changing posts
  useEffect(() => {
    if (generatedPosts.length > 0) {
      // Initialize the history array for this post if it doesn't exist
      const newPostHistory = [...postHistory];
      if (!newPostHistory[currentPostIndex]) {
        newPostHistory[currentPostIndex] = [generatedPosts[currentPostIndex]];
        setPostHistory(newPostHistory);
        
        // Initialize history index tracking
        const newHistoryIndex = [...historyIndex];
        newHistoryIndex[currentPostIndex] = 0;
        setHistoryIndex(newHistoryIndex);
      }
      
      // Set the current post's history and index
      setCurrentPostHistory(newPostHistory[currentPostIndex] || [generatedPosts[currentPostIndex]]);
      setCurrentHistoryIndex(historyIndex[currentPostIndex] || 0);
    }
  }, [currentPostIndex, generatedPosts, postHistory, historyIndex]);
  
  // Function to add a new version to history
  const addToHistory = (newVersion: string) => {
    // If we're not at the end of the history, truncate the history
    let newHistory = [...currentPostHistory];
    if (currentHistoryIndex < currentPostHistory.length - 1) {
      newHistory = newHistory.slice(0, currentHistoryIndex + 1);
    }
    
    // Add the new version
    newHistory.push(newVersion);
    
    // Update history for current post
    const newPostHistory = [...postHistory];
    newPostHistory[currentPostIndex] = newHistory;
    setPostHistory(newPostHistory);
    setCurrentPostHistory(newHistory);
    
    // Update history index
    const newIndex = newHistory.length - 1;
    const newHistoryIndex = [...historyIndex];
    newHistoryIndex[currentPostIndex] = newIndex;
    setHistoryIndex(newHistoryIndex);
    setCurrentHistoryIndex(newIndex);
  };
  
  // Handle undoing to previous version
  const handleUndo = () => {
    // Can't undo if at the beginning of history or no history
    if (currentHistoryIndex <= 0 || currentPostHistory.length <= 1) return;
    
    // Get the previous version
    const newIndex = currentHistoryIndex - 1;
    const previousVersion = currentPostHistory[newIndex];
    
    // Update history index
    const newHistoryIndex = [...historyIndex];
    newHistoryIndex[currentPostIndex] = newIndex;
    setHistoryIndex(newHistoryIndex);
    setCurrentHistoryIndex(newIndex);
    
    // Update the post with the previous version
    const newPosts = [...generatedPosts];
    newPosts[currentPostIndex] = previousVersion;
    setGeneratedPosts(newPosts);
    
    // If editing, update the edit box too
    if (isEditing) {
      setEditedPost(previousVersion);
    }
    
    // Show animation of the undo if we're not in edit mode
    if (!isEditing) {
      animateTextChange(generatedPosts[currentPostIndex], previousVersion);
    }
  };
  
  // Handle redoing to next version
  const handleRedo = () => {
    // Can't redo if at the end of history or no history
    if (currentHistoryIndex >= currentPostHistory.length - 1 || currentPostHistory.length <= 1) return;
    
    // Get the next version
    const newIndex = currentHistoryIndex + 1;
    const nextVersion = currentPostHistory[newIndex];
    
    // Update history index
    const newHistoryIndex = [...historyIndex];
    newHistoryIndex[currentPostIndex] = newIndex;
    setHistoryIndex(newHistoryIndex);
    setCurrentHistoryIndex(newIndex);
    
    // Update the post with the next version
    const newPosts = [...generatedPosts];
    newPosts[currentPostIndex] = nextVersion;
    setGeneratedPosts(newPosts);
    
    // If editing, update the edit box too
    if (isEditing) {
      setEditedPost(nextVersion);
    }
    
    // Show animation of the redo if we're not in edit mode
    if (!isEditing) {
      animateTextChange(generatedPosts[currentPostIndex], nextVersion);
    }
  };
  
  // Save the edited post
  const handleSaveEdit = () => {
    const updatedPosts = [...generatedPosts];
    updatedPosts[currentPostIndex] = editedPost;
    setGeneratedPosts(updatedPosts);
    
    // Add to history when saving an edit
    addToHistory(editedPost);
    
    setIsEditing(false);
  };
  
  // Cancel editing and revert to the original post
  const handleCancelEdit = () => {
    setEditedPost(generatedPosts[currentPostIndex]);
    setIsEditing(false);
  };
  
  // Save the current post to the dashboard
  const handleSavePost = () => {
    if (onSavePost && generatedPosts.length > 0) {
      onSavePost(generatedPosts[currentPostIndex]);
    }
  };
  
  // Update editedPost when currentPostIndex changes (if not editing)
  useEffect(() => {
    if (!isEditing && generatedPosts.length > 0) {
      setEditedPost(generatedPosts[currentPostIndex]);
    }
  }, [currentPostIndex, generatedPosts, isEditing]);
  
  // Generate topics based on industry
  const handleGenerateTopics = async () => {
    if (!industry.trim()) return;
    
    console.log(`Initiating topic generation for industry: "${industry}"`);
    setIsLoadingTopics(true);
    setTopics([]); // Clear existing topics while loading
    setError(null); // Clear any previous errors
    
    try {
      console.log('Calling fetchIndustryTopics API service...');
      const newTopics = await fetchIndustryTopics(industry);
      console.log(`Received ${newTopics.length} topics from API:`, newTopics);
      setTopics(newTopics);
    } catch (error: any) {
      console.error('Failed to generate topics:', error);
      
      // Check if this is an API key missing error
      if (error.message && error.message.includes('API key is missing')) {
        setError('Perplexity API key is missing. Please add it to your environment variables.');
      } else {
        setError('Failed to generate topics from Perplexity. Please try again or check console for details.');
      }
      
      // Fallback to default topics
      console.log('Falling back to default topics due to error');
      setTopics(TRENDING_TOPICS);
    } finally {
      console.log('Topic generation process completed');
      setIsLoadingTopics(false);
    }
  };
  
  // Effect to cycle through loading messages
  useEffect(() => {
    if (!isLoadingArticles) return;
    
    const loadingMessages = [
      'Searching for articles...',
      'Finding relevant content...',
      'Reading articles...',
      'Analyzing information...',
      'Summarizing content...',
      'Almost there...'
    ];
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setLoadingStage(loadingMessages[currentIndex]);
    }, 3000); // Change message every 3 seconds
    
    return () => {
      clearInterval(interval);
      setLoadingStage('Searching for articles...'); // Reset to default when done
    };
  }, [isLoadingArticles]);
  
  // Effect to cycle through post generation loading messages
  useEffect(() => {
    if (!isGenerating) return;
    
    const loadingMessages = [
      'Generating Posts...',
      'Analyzing article content...',
      'Crafting professional messaging...',
      'Applying industry insights...',
      'Formatting for LinkedIn...',
      'Adding personal touches...',
      'Almost done...'
    ];
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setGeneratingStage(loadingMessages[currentIndex]);
    }, 3000); // Change message every 3 seconds
    
    return () => {
      clearInterval(interval);
      setGeneratingStage('Generating Posts...'); // Reset to default when done
    };
  }, [isGenerating]);
  
  // Effect to cycle through topic generation loading messages
  useEffect(() => {
    if (!isLoadingTopics) return;
    
    const loadingMessages = [
      'Generating topics...',
      'Analyzing industry trends...',
      'Finding relevant topics...',
      'Organizing industry insights...',
      'Curating trending topics...'
    ];
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setTopicLoadingStage(loadingMessages[currentIndex]);
    }, 3000); // Change message every 3 seconds
    
    return () => {
      clearInterval(interval);
      setTopicLoadingStage('Generating topics...'); // Reset to default when done
    };
  }, [isLoadingTopics]);
  
  // Rotate through placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % aiEditPlaceholders.length);
    }, 3000); // Change the placeholder every 3 seconds
    
    return () => clearInterval(interval);
  }, [aiEditPlaceholders.length]);
  
  // Effect to cycle through AI editing loading messages
  useEffect(() => {
    if (!isGenerating) return;
    
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
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setAiEditingStage(loadingMessages[currentIndex]);
    }, 2000); // Change message every 2 seconds
    
    return () => {
      clearInterval(interval);
      setAiEditingStage('Applying edits...'); // Reset to default when done
    };
  }, [isGenerating]);
  
  // Function to animate the text transition between old and new versions
  const animateTextChange = (oldText: string, newText: string) => {
    setIsAnimatingEdit(true);
    setAnimatedText(oldText);

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
            // Update the actual post after animation completes
            const newPosts = [...generatedPosts];
            newPosts[currentPostIndex] = newText;
            setGeneratedPosts(newPosts);
          }
        }, 25); // Typing speed
      }
    }, 15); // Backspacing speed
  };
  
  // Handle AI edit submission
  const handleAiEdit = async () => {
    if (!aiEditText.trim() || !generatedPosts[currentPostIndex]) return;
    
    setIsGenerating(true);
    
    try {
      // Call OpenAI API to edit the post
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postContent: generatedPosts[currentPostIndex],
          editInstruction: aiEditText
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

      // Start animation between old text and new text
      animateTextChange(generatedPosts[currentPostIndex], data.editedPost);
      
      // Add this edit to history after animation
      addToHistory(data.editedPost);
      
      // Reset the input
      setAiEditText('');
    } catch (error) {
      console.error('Error editing post:', error);
      // Fallback to basic editing if API fails
      const newPosts = [...generatedPosts];
      newPosts[currentPostIndex] = generatedPosts[currentPostIndex] + '\n\n[Edit failed, please try again]';
      setGeneratedPosts(newPosts);
      setIsAnimatingEdit(false);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Determine if Generate button should be enabled
  const canGenerate = !isGenerating && searchTopic.trim().length > 0 && (isUrlInput || !!selectedArticle);
  
  // Fetch article summary for a URL
  const fetchUrlSummary = async (url: string) => {
    if (!isValidUrl(url)) return;
    
    setIsLoadingUrlSummary(true);
    setUrlSummaryError(null);
    setUrlArticleSummary(null);

    try {
      console.log(`Fetching summary for URL: ${url}`);
      // Here we use the backend summarizeUrlContent functionality
      const response = await fetch('/api/summarize-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('URL Summary API Error:', response.status, errorData);
        throw new Error(`URL summary failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('URL summary:', data);
      
      setUrlArticleSummary({
        title: data.title,
        summary: data.summary,
        url: url
      });
    } catch (error: any) {
      console.error('Error fetching URL summary:', error);
      setUrlSummaryError('Failed to load article summary. Please check the URL and try again.');
    } finally {
      setIsLoadingUrlSummary(false);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg space-y-6 max-w-4xl mx-auto">
      {/* Step 1: Industry & Topic/URL Input */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="industry-input" className="text-lg font-semibold text-gray-800">
          What's your industry?
        </label>
        <div className="flex items-center gap-2">
           <input
            id="industry-input"
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g., Healthcare, Technology, Finance"
            className="flex-1 border p-3 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && industry.trim()) {
                handleGenerateTopics();
              }
            }}
          />
          <button
             onClick={handleGenerateTopics}
             disabled={!industry.trim() || isLoadingTopics}
             className="whitespace-nowrap px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
           >
             {isLoadingTopics ? (
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
           {/* Error message for topics */}
           {error && (
             <div className="mt-2 text-red-500 text-sm">
               {error}
             </div>
           )}
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="topicOrUrl" className="text-lg font-semibold text-gray-800">
          Enter Topic or Article URL
        </label>
        <div className="flex gap-2">
          <input
            id="topicOrUrl"
            type="text"
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            placeholder="e.g., 'Future of AI' or 'https://example.com/article'"
            className="flex-1 border p-3 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
            onKeyPress={(e) => {
                 // Trigger search on Enter only if it's a topic
                 if (e.key === 'Enter' && searchTopic.trim() && !isUrlInput) {
                   handleTopicSearch(searchTopic.trim(), true);
                 }
                 // Trigger generation on Enter if it's a URL and valid
                 if (e.key === 'Enter' && isUrlInput && canGenerate) {
                    handleGeneratePosts();
                 }
            }}
          />
          {/* Show search button only if input is not a URL */}
          { !isUrlInput && (
            <button
                onClick={() => handleTopicSearch(searchTopic.trim(), true)}
                disabled={!searchTopic.trim() || isLoadingArticles}
                className="px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                aria-label="Search Topic"
              >
                {isLoadingArticles ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                )}
              </button>
           )}
        </div>
      </div>

       {/* URL Article Preview (Only show if input is a URL) */}
       {isUrlInput && (
         <div className="mt-6">
           {isLoadingUrlSummary ? (
             // Loading skeleton for URL summary
             <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
               <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
               <div className="space-y-2">
                 <div className="h-4 bg-gray-200 rounded w-full"></div>
                 <div className="h-4 bg-gray-200 rounded w-full"></div>
                 <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                 <div className="h-4 bg-gray-200 rounded w-full"></div>
               </div>
             </div>
           ) : urlArticleSummary ? (
             // URL summary display
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <h3 className="text-xl font-semibold text-gray-800 mb-2">{urlArticleSummary.title}</h3>
               <div className="text-gray-600 mb-3">{urlArticleSummary.summary}</div>
               <div className="text-sm text-gray-500 flex items-center">
                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                 </svg>
                 <a href={urlArticleSummary.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                   {urlArticleSummary.url.length > 50 ? urlArticleSummary.url.substring(0, 50) + '...' : urlArticleSummary.url}
                 </a>
               </div>
             </div>
           ) : urlSummaryError ? (
             // Error message
             <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
               <div className="flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span>{urlSummaryError}</span>
               </div>
             </div>
           ) : searchTopic.length > 0 ? (
             // Prompt to enter a valid URL
             <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg p-4 text-center">
               <p>Enter a complete URL to see article summary</p>
             </div>
           ) : null}
         </div>
       )}

       {/* Topic Pills Section (Show if not URL input) */}
      { !isUrlInput && (
          <div className="mt-4 flex flex-wrap gap-2">
             {isLoadingTopics ? (
               // Skeleton loading for topics
               Array(10).fill(0).map((_, index) => (
                 <div
                   key={index}
                   className="px-3 py-1 rounded-full bg-gray-200 animate-pulse w-32 h-8"
                 ></div>
               ))
             ) : topics.length > 0 ? (
               // Rendered topics
               topics.map(topic => (
                 <button
                   key={topic.id}
                   // Pass label to search function to match existing behavior
                   onClick={() => handleTopicSearch(topic.label, false)}
                   className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                     selectedTopicLabel === topic.label
                       ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500'
                       : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                     }`}
                 >
                   {topic.label}
                 </button>
               ))
             ) : (
               // No topics state (e.g., after initial load or if API failed without fallback)
                !industry && <p className="text-gray-500 italic text-sm">Enter your industry and click "Generate Topics" to see relevant trending topics.</p>
             )}
           </div>
       )}

      {/* Step 2: Article Selection (Only show if input is a topic and articles are loaded/loading) */}
       { !isUrlInput && (articles.length > 0 || isLoadingArticles || articleError) && ( // Show this section if we have articles, are loading, or have an error (for topics only)
         <div className="space-y-4 mt-6">
           <h3 className="text-xl font-semibold text-gray-800 mb-2">Select an Article</h3>
           <div className="flex justify-between items-center mb-3">
             <span className="text-sm text-gray-500 hidden sm:inline-block">
               <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
               </svg>
               Swipe to browse
             </span>
             <div className="flex space-x-2">
               <button
                 onClick={() => scrollArticles('left')}
                 className="p-1 rounded-full hover:bg-gray-100"
                 aria-label="Scroll left"
               >
                 <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
               </button>
               <button
                 onClick={() => scrollArticles('right')}
                 className="p-1 rounded-full hover:bg-gray-100"
                 aria-label="Scroll right"
               >
                 <ChevronRightIcon className="h-6 w-6 text-gray-600" />
               </button>
             </div>
           </div>
           
           {/* Article Display Area */}
           <div className="relative">
             {/* Loading state for articles */}
             {isLoadingArticles && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                 <div className="text-center">
                   <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <p className="mt-2 text-gray-600">{loadingStage}</p>
                 </div>
               </div>
             )}
             
             {/* Article Grid or Swiper */}
             <div className="relative overflow-hidden rounded-lg">
               {isLoadingArticles ? (
                 // Loading skeleton grid
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                   {Array(3).fill(0).map((_, index) => (
                     <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                       <div className="h-44 bg-gray-200 animate-pulse"></div>
                       <div className="p-4">
                         <div className="h-6 bg-gray-200 animate-pulse mb-2 w-3/4"></div>
                         <div className="h-4 bg-gray-200 animate-pulse mb-2 w-1/2"></div>
                         <div className="h-4 bg-gray-200 animate-pulse mb-2 w-full"></div>
                         <div className="h-4 bg-gray-200 animate-pulse mb-2 w-full"></div>
                         <div className="h-4 bg-gray-200 animate-pulse w-2/3"></div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : articles.length > 0 ? (
                 // Swiper with articles
                 <Swiper
                   onSwiper={(swiper) => {
                     swiperRef.current = swiper;
                   }}
                   slidesPerView="auto"
                   spaceBetween={16}
                   freeMode={{
                     enabled: true,
                     momentum: true,
                     momentumRatio: 0.8,
                     momentumVelocityRatio: 0.8,
                   }}
                   modules={[FreeMode, Navigation]}
                   wrapperClass="px-2 py-2"
                 >
                   {articles.map((article) => (
                     <SwiperSlide key={article.id} className="!w-80 max-w-[80vw]">
                       <div 
                         className={`h-full rounded-lg overflow-hidden transition-all transform hover:scale-[1.02] cursor-pointer ${
                           selectedArticle?.id === article.id ? 'ring-4 ring-blue-500' : 'border border-gray-200'
                         }`}
                         onClick={() => handleSelectArticle(article)}
                       >
                         <div className="relative h-44 w-full">
                           <Image
                             src={article.imageUrl}
                             alt={article.title}
                             fill
                             sizes="320px"
                             className="object-cover"
                             unoptimized={true}
                             draggable="false"
                           />
                         </div>
                         <div className="p-4 flex flex-col h-[calc(100%-11rem)]">
                           <div className="min-h-[3.5rem]">
                             <h4 className={`font-medium text-gray-900 mb-1 ${
                               article.title.length > 60 
                                 ? 'text-sm leading-tight' 
                                 : article.title.length > 40 
                                   ? 'text-base leading-tight' 
                                   : 'text-lg'
                             }`}>
                               {article.title}
                             </h4>
                           </div>
                           <div className="flex items-center mb-2">
                             <span className="text-sm text-gray-600">
                               {article.author} • {article.publication}
                             </span>
                           </div>
                           <p className="text-gray-600 text-sm flex-grow overflow-hidden line-clamp-3">{article.summary}</p>
                           <button 
                             className="mt-3 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                             onClick={(e) => {
                               e.stopPropagation(); // Prevent article selection
                               handleOpenArticle(article.sourceUrl);
                             }}
                           >
                             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                             Read Original
                           </button>
                         </div>
                       </div>
                     </SwiperSlide>
                   ))}
                 </Swiper>
               ) : (
                 // No articles found
                 <div className="bg-gray-50 rounded-lg p-8 text-center">
                   <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                   </svg>
                   <h3 className="mt-2 text-lg font-medium text-gray-900">No articles found</h3>
                   <p className="mt-1 text-gray-500">Try selecting a different topic or checking back later.</p>
                 </div>
               )}
               
               {/* Add shadow indicators for overflow content */}
               <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
               <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
             </div>
           </div>
           
           {/* Selected Article Preview */}
           {selectedArticle && (
             <div className="mt-6 bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-lg font-semibold text-blue-800">Selected Article</h4>
                 <button 
                   onClick={() => handleOpenArticle(selectedArticle.sourceUrl)}
                   className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                 >
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
                   Read Original
                 </button>
               </div>
               <h3 className="text-xl text-gray-900 mb-2">{selectedArticle.title}</h3>
               <div className="flex items-center mb-3 text-gray-600 text-sm">
                 <span>By {selectedArticle.author}</span>
                 <span className="mx-2">•</span>
                 <span>{selectedArticle.publication}</span>
               </div>
               <div className="text-gray-700 mb-4 whitespace-pre-line">{selectedArticle.summary}</div>
             </div>
           )}
         </div>
       )}
       { !isUrlInput && articleError && !isLoadingArticles && (
         <div className="text-red-500 mt-2">{articleError}</div>
       )}

      {/* Step 3: Generate Posts Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleGeneratePosts}
          disabled={!canGenerate} // Updated disabled logic
          className={`px-8 py-3 rounded-md text-white font-semibold transition duration-150 ease-in-out flex items-center justify-center space-x-2 ${
            canGenerate ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            'Generate Posts'
          )}
        </button>
      </div>

      {/* Post generation loading skeleton */}
      {isGenerating && generatedPosts.length === 0 && (
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto animate-pulse">
            {/* Post header skeleton */}
            <div className="border-b px-4 py-2">
              <div className="flex justify-between">
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
                <div className="flex space-x-1">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Profile header skeleton */}
            <div className="p-4 flex items-center space-x-2">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            
            {/* Post content skeleton */}
            <div className="px-4 pb-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            
            {/* Save button skeleton */}
            <div className="border-t p-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
          <div className="text-center mt-4 text-indigo-600 font-medium">{generatingStage}</div>
        </div>
      )}

      {/* Step 4: Display Generated Posts */}
      { generatedPosts.length > 0 && (
         <div className="mt-8">
           <div className="bg-white rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto">
             {/* Post navigation and count */}
             <div className="flex items-center justify-between border-b px-4 py-2">
               <div className="flex items-center">
                 <button
                   onClick={handlePreviousPost}
                   disabled={currentPostIndex === 0}
                   className={`p-1 rounded-full ${
                     currentPostIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                   aria-label="Previous post"
                 >
                   <ChevronLeftIcon className="h-6 w-6" />
                 </button>
                 <span className="px-2 text-sm text-gray-600">
                   {currentPostIndex + 1}/{generatedPosts.length}
                 </span>
                 <button
                   onClick={handleNextPost}
                   disabled={currentPostIndex === generatedPosts.length - 1}
                   className={`p-1 rounded-full ${
                     currentPostIndex === generatedPosts.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                   aria-label="Next post"
                 >
                   <ChevronRightIcon className="h-6 w-6" />
                 </button>
               </div>
               
               {/* Edit and AI Edit controls */}
               <div className="flex items-center space-x-1">
                 {/* History navigation buttons */}
                 <button
                   onClick={handleUndo}
                   disabled={!currentPostHistory || currentHistoryIndex <= 0}
                   className={`p-1 rounded-full ${
                     !currentPostHistory || currentHistoryIndex <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                   aria-label="Undo changes"
                   title="Undo"
                 >
                   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                   </svg>
                 </button>
                 
                 <button
                   onClick={handleRedo}
                   disabled={!currentPostHistory || currentHistoryIndex >= currentPostHistory.length - 1}
                   className={`p-1 rounded-full ${
                     !currentPostHistory || currentHistoryIndex >= currentPostHistory.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                   aria-label="Redo changes"
                   title="Redo"
                 >
                   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h-4v4m6 0H6a4 4 0 01-4-4V6a4 4 0 014-4h12a4 4 0 014 4v4a4 4 0 01-4 4h-1.5" transform="scale(-1, 1) translate(-24, 0)" />
                   </svg>
                 </button>
                 
                 {/* AI edit button */}
                 <button
                   onClick={toggleAiEdit}
                   className={`p-1 rounded-full ${
                     isAiEditOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                   aria-label="AI Edit"
                   title="AI Edit"
                 >
                   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                 </button>
                 
                 {/* Edit button */}
                 <button
                   onClick={handleStartEditing}
                   disabled={isEditing}
                   className={`p-1 rounded-full ${
                     isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                   }`}
                   aria-label="Edit post"
                   title="Edit"
                 >
                   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                   </svg>
                 </button>
               </div>
             </div>
             
             {/* AI Edit panel */}
             {isAiEditOpen && (
               <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 space-y-2">
                 <div className="flex items-center space-x-2">
                   <input
                     type="text"
                     value={aiEditText}
                     onChange={(e) => setAiEditText(e.target.value)}
                     placeholder={`${aiEditPlaceholders[placeholderIndex]}...`}
                     className="flex-1 text-sm border border-indigo-200 p-2 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                     onKeyPress={(e) => {
                       if (e.key === 'Enter' && aiEditText.trim()) {
                         handleAiEdit();
                       }
                     }}
                   />
                   <button
                     onClick={handleAiEdit}
                     disabled={!aiEditText.trim() || isGenerating}
                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                   >
                     {isGenerating ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         <span>Editing...</span>
                       </>
                     ) : (
                       <>
                         <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <span>Edit with AI</span>
                       </>
                     )}
                   </button>
                 </div>
                 <div className="text-xs text-indigo-600">
                   <svg className="h-3 w-3 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Try: "Add a call to action", "Remove hashtags", "Make more professional"
                 </div>
               </div>
             )}
             
             {/* LinkedIn-style post */}
             <div className="flex flex-col">
               {/* Profile header */}
               <div className="flex items-center space-x-2 p-4">
                 <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                   {profileData.avatar_url ? (
                     <Image
                       src={profileData.avatar_url}
                       alt="Profile"
                       width={48}
                       height={48}
                       className="h-full w-full object-cover"
                       unoptimized={true}
                     />
                   ) : (
                     <UserCircleIcon className="h-12 w-12 text-gray-400" />
                   )}
                 </div>
                 <div>
                   <h3 className="font-medium text-gray-900">{profileData.full_name}</h3>
                   <p className="text-sm text-gray-500">{profileData.job_title}</p>
                 </div>
               </div>
               
               {/* Post content area */}
               <div className="px-4 pb-4">
                 {isEditing ? (
                   // Edit mode
                   <div className="space-y-3">
                     <textarea
                       ref={textareaRef}
                       value={editedPost}
                       onChange={(e) => setEditedPost(e.target.value)}
                       className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       placeholder="Edit your post..."
                     />
                     <div className="flex justify-end space-x-2">
                       <button
                         onClick={handleCancelEdit}
                         className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                       >
                         Cancel
                       </button>
                       <button
                         onClick={handleSaveEdit}
                         className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors"
                       >
                         Save
                       </button>
                     </div>
                   </div>
                 ) : (
                   // Display mode
                   <div>
                     {isAnimatingEdit ? (
                       <div className="relative min-h-[200px] whitespace-pre-wrap">
                         <p className="text-gray-800">{animatedText}</p>
                         <span className="animate-blink border-r-2 border-blue-500 ml-1 h-5 absolute inline-block" style={{ marginTop: '-2px' }}></span>
                       </div>
                     ) : (
                       <p className="text-gray-800 whitespace-pre-wrap">{generatedPosts[currentPostIndex]}</p>
                     )}
                   </div>
                 )}
               </div>
             </div>
             
             {/* Save post button */}
             <div className="border-t p-4">
               <button
                 onClick={handleSavePost}
                 className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
               >
                 Save to Dashboard
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
} 