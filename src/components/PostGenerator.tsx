"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import Image from 'next/image';
import profilePic from '../soladugbo.jpg';
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

/**
 * Generates LinkedIn posts based on an article using Perplexity API
 */
async function generatePostsFromArticle(article: Article): Promise<string[]> {
  console.log('Generating posts for article:', article.title);
  
  // Check if API key is available
  const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
  if (!PERPLEXITY_API_KEY) {
    console.error('Perplexity API key is missing');
    return FALLBACK_GENERATED_POSTS;
  }
  
  try {
    const query = `Generate 4 unique, engaging LinkedIn posts based on this article:
      Title: "${article.title}"
      Author: "${article.author}"
      Publication: "${article.publication}"
      Summary: "${article.summary}"
      
      Each post should:
      1. Be 2-3 paragraphs (100-200 words)
      2. Sound authentic and conversational (like a real person, not AI)
      3. Include relevant hashtags at the end (2-4 hashtags)
      4. Ask a thoughtful question to encourage engagement
      5. Reference the article content without repeating the title verbatim
      6. Have a unique angle or personal insight
      
      Return 4 distinct posts separated by a delimiter, not numbered or with any prefix.`;
    
    console.log('Making Perplexity API call for post generation');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates engaging LinkedIn posts based on articles.'
          },
          {
            role: 'user',
            content: query
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perplexity API error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Post generation API response:', data);
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from Perplexity API');
    }
    
    // Split the content into separate posts - assume posts are separated by line breaks
    const posts = content.split(/\n{2,}/)
      .filter(post => post.trim().length > 0)
      .map(post => post.trim())
      .slice(0, 4); // Take at most 4 posts
    
    console.log('Generated posts:', posts);
    
    if (posts.length === 0) {
      throw new Error('No valid posts were generated');
    }
    
    return posts;
  } catch (error) {
    console.error('Error generating posts:', error);
    return FALLBACK_GENERATED_POSTS;
  }
}

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
    if (!selectedArticle) return;
    
    setIsGenerating(true);
    
    try {
      // Always use Claude-style post generation with industry and topic context
      const posts = await generatePostsWithClaude(
        selectedArticle,
        industry || 'Professional', // Fallback if industry is empty
        selectedTopicLabel || 'Business' // Fallback if topic is empty
      );
      
      setGeneratedPosts(posts);
      setCurrentPostIndex(0);
      setEditedPost(posts[0]);
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
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Post Generator Form */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate LinkedIn Posts</h2>
        
        {/* Industry Input */}
        <div className="mb-6">
          <label htmlFor="industry-input" className="block text-lg font-medium text-gray-700 mb-2">
            What's your industry?
          </label>
          <div className="flex items-center gap-2">
            <input
              id="industry-input"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Healthcare, Technology, Finance"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && industry.trim()) {
                  handleGenerateTopics();
                }
              }}
            />
            <button
              onClick={handleGenerateTopics}
              disabled={!industry.trim() || isLoadingTopics}
              className="whitespace-nowrap px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoadingTopics ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Topics'
              )}
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-2 text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* Topic Selection */}
        <div className="mb-6">
          <label htmlFor="topic-search" className="block text-lg font-medium text-gray-700 mb-2">
            Find Articles by Topic
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <input
                id="topic-search"
                type="text"
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="Type a topic (e.g., AI, Leadership) or select from below"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button
                onClick={() => handleTopicSearch(searchTopic.trim(), true)}
                disabled={!searchTopic.trim() || isLoadingArticles}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
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
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
            {searchTopic && !isLoadingArticles && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                <div className="max-h-60 overflow-y-auto">
                  {topics
                    .filter(topic => topic.label.toLowerCase().includes(searchTopic.toLowerCase()))
                    .map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicSearch(topic.id)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        {topic.label}
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          
          {/* Topic Pills - with Loading State */}
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
                  onClick={() => handleTopicSearch(topic.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${selectedTopic === topic.id 
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                >
                  {topic.label}
                </button>
              ))
            ) : (
              // No topics state
              <p className="text-gray-500 italic">Enter your industry and click "Generate Topics" to see relevant trending topics</p>
            )}
          </div>
        </div>
        
        {/* Article Selection - Shown only when a topic is selected or searching */}
        {(selectedTopic || searchTopic.trim()) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-800">Select an Article</h3>
              <div className="flex items-center space-x-3">
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
            </div>
            
            {/* Error message for articles */}
            {articleError && !isLoadingArticles && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-700">{articleError}</p>
              </div>
            )}
            
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
          </div>
        )}
        
        {/* Generate Button - Only visible when an article is selected */}
        {selectedArticle && (
          <div className="mt-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className={`font-medium text-blue-900 mb-2 ${
                selectedArticle.title.length > 80 
                  ? 'text-base leading-tight' 
                  : selectedArticle.title.length > 50 
                    ? 'text-lg leading-tight' 
                    : 'text-xl'
              }`}>
                {selectedArticle.title}
              </h4>
              <div className="flex items-center mb-2">
                <span className="text-sm text-blue-800">
                  By {selectedArticle.author} • {selectedArticle.publication}
                </span>
              </div>
              <p className="text-blue-800 text-sm mb-3">{selectedArticle.summary}</p>
              <button 
                className="text-blue-700 hover:text-blue-900 text-sm flex items-center"
                onClick={() => handleOpenArticle(selectedArticle.sourceUrl)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Read Full Article
              </button>
            </div>
            
            <button
              onClick={handleGeneratePosts}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Industry-Expert Posts'
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Generated Posts ({currentPostIndex + 1}/{generatedPosts.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousPost}
                disabled={currentPostIndex === 0}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous post"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <button
                onClick={handleNextPost}
                disabled={currentPostIndex === generatedPosts.length - 1}
                className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next post"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* LinkedIn-style Post Container */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm mb-4">
            {/* Post Header with Profile */}
            <div className="flex items-start p-4 border-b border-gray-100">
              <div className="flex-shrink-0 mr-3">
                <Image 
                  src={profilePic} 
                  alt="Sola Dugbo" 
                  width={48} 
                  height={48} 
                  className="rounded-full border border-gray-200"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Sola Dugbo</h4>
                    <p className="text-gray-500 text-sm">Digital Marketing Specialist</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>1d • </span>
                      <svg className="h-3 w-3 ml-1 text-gray-500" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                      </svg>
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUndo}
                        disabled={!currentPostHistory || currentPostHistory.length <= 1}
                        className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-indigo-500"
                        aria-label="Undo changes"
                        title="Undo to previous version"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={toggleAiEdit}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                        aria-label="AI Edit post"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleStartEditing}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        aria-label="Edit post"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* AI Edit Bar - Inside post container with animation */}
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isAiEditOpen ? 'max-h-24 opacity-100 border-b border-gray-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-3 bg-blue-50">
                <div className="flex">
                  <input
                    id="ai-edit"
                    type="text"
                    value={aiEditText}
                    onChange={(e) => setAiEditText(e.target.value)}
                    placeholder={aiEditPlaceholders[placeholderIndex]}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-l-md text-gray-700 placeholder-gray-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleAiEdit}
                    disabled={isGenerating || !aiEditText.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {aiEditingStage}
                      </>
                    ) : (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.48 4.415c.293-.293.77-.293 1.061 0l4.95 4.95a.75.75 0 010 1.06l-4.95 4.95a.75.75 0 01-1.06-1.06L12.44 10 8.48 6.04a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                        ✨
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Post Content */}
            <div className="p-4">
              {isEditing ? (
                <div className="flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={editedPost}
                    onChange={(e) => setEditedPost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[150px] resize-y mb-3"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">
                  {isAnimatingEdit ? animatedText : generatedPosts[currentPostIndex]}
                  {isAnimatingEdit && (
                    <span className="inline-block w-1 h-4 bg-blue-500 ml-[1px] animate-pulse"></span>
                  )}
                </p>
              )}
            </div>
            
            {/* Post Footer with Engagement Metrics */}
            {!isEditing && (
              <div className="border-t border-gray-100 px-4 py-2">
                <div className="flex justify-between text-gray-500 text-sm">
                  <div className="flex items-center">
                    <span className="flex items-center mr-4">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.224 2.224 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.866.866 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
                      </svg>
                      Like
                    </span>
                    <span className="flex items-center mr-4">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                        <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                      </svg>
                      Comment
                    </span>
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                      </svg>
                      Share
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    <span>You</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Post Source Info */}
          {selectedArticle && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
              <p>Generated based on: <strong>{selectedArticle.title}</strong></p>
            </div>
          )}
          
          {/* Save Button */}
          <button
            onClick={handleSavePost}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
          >
            Save to Dashboard
          </button>
        </div>
      )}
      
      {/* Custom styling for Swiper */}
      <style jsx global>{`
        .swiper-slide {
          height: auto;
        }
        
        .swiper {
          margin-left: 0;
          margin-right: 0;
          position: relative;
          overflow: hidden;
          list-style: none;
          padding: 0;
          z-index: 1;
          width: 100%;
        }
        
        .swiper-wrapper {
          max-width: 100%;
          height: 100%;
          z-index: 1;
          display: flex;
          transition-property: transform;
          box-sizing: content-box;
        }
      `}</style>
    </div>
  );
} 