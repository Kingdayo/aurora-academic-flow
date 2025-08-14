import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Brain, Send, Lightbulb, BookOpen, Clock, Target, Search, GraduationCap, Loader2, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiService, type AcademicContext } from '@/services/aiService';
import LoadingSpinner from './LoadingSpinner';

interface AIResponse {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  category: string;
}

const AIAssistant = () => {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('flan-t5');
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedResponses = localStorage.getItem('ai-responses');
    if (savedResponses) {
      setResponses(JSON.parse(savedResponses));
    }
    
    // Initialize AI model on component mount
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      setIsModelLoading(true);
      await aiService.initializeModel(selectedModel);
      setIsInitialized(true);
      toast({
        title: "AI Assistant Ready",
        description: "The AI model has been loaded and is ready to help!",
      });
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      toast({
        title: "AI Initialization Failed",
        description: "Using fallback responses. AI features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsModelLoading(false);
    }
  };

  // Get query category based on keywords
  const getQueryCategory = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('study') || lowerQuery.includes('learn') || lowerQuery.includes('focus')) return 'study';
    if (lowerQuery.includes('task') || lowerQuery.includes('organize') || lowerQuery.includes('priority')) return 'tasks';
    if (lowerQuery.includes('time') || lowerQuery.includes('schedule') || lowerQuery.includes('plan')) return 'time';
    if (lowerQuery.includes('exam') || lowerQuery.includes('test') || lowerQuery.includes('review')) return 'exam';
    if (lowerQuery.includes('research') || lowerQuery.includes('writing') || lowerQuery.includes('paper')) return 'research';
    if (lowerQuery.includes('subject') || lowerQuery.includes('math') || lowerQuery.includes('science')) return 'subjects';
    
    return 'study';
  };

  // Generate AI response using the AI service
  const generateAIResponse = async (userQuery: string, category: string): Promise<string> => {
    // Get context from localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const recentQueries = responses.slice(-3).map(r => r.query);
    
    const context: AcademicContext = {
      tasks,
      recentQueries,
      userProfile: {
        subjects: [], // Could be extracted from tasks or user settings
        academicLevel: 'undergraduate' // Could be from user profile
      }
    };

    try {
      if (isInitialized) {
        return await aiService.generateResponse(userQuery, category, context, selectedModel);
      } else {
        throw new Error('AI not initialized');
      }
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      return aiService.getFallbackResponse(category, userQuery);
    }
  };

  // Handle AI query submission
  const handleAIQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      const category = getQueryCategory(query);
      const response = await generateAIResponse(query, category);
      
      const newResponse: AIResponse = {
        id: Date.now().toString(),
        query: query.trim(),
        response,
        timestamp: new Date().toLocaleTimeString(),
        category
      };
      
      const updatedResponses = [newResponse, ...responses];
      setResponses(updatedResponses);
      localStorage.setItem('ai-responses', JSON.stringify(updatedResponses));
      
      setQuery('');
      
      toast({
        title: "AI Response Generated",
        description: "Your AI academic assistant provided personalized guidance!",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick prompt suggestions
  const quickPrompts = [
    { icon: Lightbulb, text: "How can I improve my study habits?", category: "study" },
    { icon: Clock, text: "Help me manage my time better", category: "time" },
    { icon: Target, text: "How do I prioritize my tasks?", category: "tasks" },
    { icon: BookOpen, text: "Best strategies for exam preparation", category: "exam" },
    { icon: Search, text: "Research and note-taking tips", category: "research" },
    { icon: GraduationCap, text: "Subject-specific study methods", category: "subjects" }
  ];

  const handleQuickPrompt = (promptText: string) => {
    setQuery(promptText);
  };

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    const icons = {
      study: Lightbulb,
      tasks: Target,
      time: Clock,
      exam: BookOpen,
      research: Search,
      subjects: GraduationCap
    };
    return icons[category as keyof typeof icons] || Lightbulb;
  };

  // Category color mapping
  const getCategoryColor = (category: string) => {
    const colors = {
      study: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      tasks: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      time: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      exam: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      research: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      subjects: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    };
    return colors[category as keyof typeof colors] || colors.study;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Academic Assistant</h2>
          <p className="text-gray-600 dark:text-gray-300">Get personalized study guidance powered by AI</p>
        </div>
        <div className="flex items-center gap-2">
          {isModelLoading ? (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading AI...
            </div>
          ) : isInitialized ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Cpu className="w-4 h-4" />
              AI Ready
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Cpu className="w-4 h-4" />
              Fallback Mode
            </div>
          )}
        </div>
      </div>

      {/* Query Input */}
      <div className="flex gap-3 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me anything about studying, time management, or academic success..."
          className="flex-1 border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600"
          onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
          disabled={isModelLoading}
        />
        <Button 
          onClick={handleAIQuery}
          disabled={isLoading || !query.trim() || isModelLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Quick Prompts */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Prompts:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {quickPrompts.map((prompt, index) => {
            const IconComponent = prompt.icon;
            return (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleQuickPrompt(prompt.text)}
                className="h-auto p-3 text-left justify-start hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                disabled={isLoading || isModelLoading}
              >
                <IconComponent className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                <span className="text-sm">{prompt.text}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* AI Responses */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {responses.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Ask me anything about your academic journey!</p>
            <p className="text-sm mt-1">I'm here to help with study strategies, time management, and more.</p>
          </div>
        )}

        {responses.map((response) => {
          const CategoryIcon = getCategoryIcon(response.category);
          return (
            <div key={response.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getCategoryColor(response.category)}>
                      {response.category}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{response.timestamp}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white mb-2">{response.query}</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{response.response}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AIAssistant;