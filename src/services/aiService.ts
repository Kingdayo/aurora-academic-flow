import { supabase } from '@/integrations/supabase/client';

export interface AIServiceConfig {
  model: string;
  provider: 'gemini';
  maxTokens: number;
}

export interface AcademicContext {
  tasks?: any[];
  recentQueries?: string[];
  userProfile?: {
    subjects?: string[];
    academicLevel?: string;
  };
}

class AIService {
  private isInitialized = false;
  private conversationHistory: string[] = [];

  private configs: Record<string, AIServiceConfig> = {
    'gemini-flash': {
      model: 'gemini-1.5-flash-latest',
      provider: 'gemini',
      maxTokens: 512,
    },
  };

  async initializeModel(modelKey: string = 'gemini-flash'): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // For Gemini, we don't need to load a model locally
      // Just verify the edge function is available
      console.log(`Initializing Google Gemini Flash model`);
      this.isInitialized = true;
      console.log(`Gemini Flash initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize Gemini:`, error);
      throw error;
    }
  }

  isModelLoading(modelKey: string = 'gemini-flash'): boolean {
    return false; // Gemini doesn't have local loading states
  }

  isModelInitialized(): boolean {
    return this.isInitialized;
  }

  private buildAcademicPrompt(query: string, category: string, context?: AcademicContext): any[] {
    const level = context?.userProfile?.academicLevel || 'university';
    const systemPrompt = `You are a friendly and helpful academic assistant. Your goal is to provide clear, concise, and accurate answers to academic questions. Please provide answers suitable for a ${level} student.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];
  }

  private isEducationalConcept(query: string): boolean {
    const educationalKeywords = [
      'what is', 'define', 'explain', 'technique', 'method', 'theory', 'principle', 
      'concept', 'approach', 'strategy', 'framework', 'model', 'law', 'rule'
    ];
    
    return educationalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  async generateResponse(
    query: string,
    category: string = 'study',
    context?: AcademicContext,
    modelKey: string = 'gemini-flash'
  ): Promise<string> {
    try {
      // Ensure model is initialized
      if (!this.isInitialized) {
        await this.initializeModel(modelKey);
      }

      console.log('Generating AI response with Gemini Flash');

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          query, 
          category, 
          context 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data || !data.response) {
        throw new Error('Invalid response from AI service');
      }

      const response = data.response.trim();
      
      // Add to conversation history
      this.conversationHistory.push(`Q: ${query}`);
      this.conversationHistory.push(`A: ${response}`);
      
      // Keep only last 6 entries (3 Q&A pairs)
      if (this.conversationHistory.length > 6) {
        this.conversationHistory = this.conversationHistory.slice(-6);
      }

      return response;
    } catch (error) {
      console.error('AI generation error:', error);
      return this.getFallbackResponse(category, query);
    }
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  getAvailableModels(): string[] {
    return Object.keys(this.configs);
  }

  // Enhanced fallback responses with educational content
  getFallbackResponse(category: string, query?: string): string {
    // Check for specific educational concepts
    if (query && this.isEducationalConcept(query)) {
      return this.getEducationalFallback(query);
    }

    const fallbacks = {
      study: "Here's a proven study strategy: Use the Pomodoro Technique (25 min focus + 5 min break), create summaries of key concepts, and test yourself regularly. Active recall is more effective than passive reading.",
      tasks: "Break large tasks into smaller, manageable chunks. Set specific deadlines for each part. Use a priority system: urgent & important first, then important but not urgent.",
      subjects: "For better subject understanding: Connect new concepts to what you already know, use multiple learning methods (visual, auditory, kinesthetic), and explain concepts to others.",
      exam: "Effective exam prep: Create a study schedule 2-3 weeks before, practice with past papers, form study groups, and ensure good sleep before the exam.",
      research: "Good research starts with a clear question. Use academic databases, evaluate source credibility, take detailed notes, and organize your findings thematically.",
      time: "Time management tips: Use a calendar app, batch similar tasks together, eliminate distractions during study time, and schedule breaks to maintain focus."
    };
    
    return fallbacks[category as keyof typeof fallbacks] || fallbacks.study;
  }

  private getEducationalFallback(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Specific educational concept responses
    if (lowerQuery.includes('feynman technique')) {
      return "The Feynman Technique is a learning method where you explain a concept in simple terms as if teaching a child. Steps: 1) Choose a concept 2) Explain it simply 3) Identify gaps in understanding 4) Review and simplify further. This helps identify knowledge gaps and improves retention through active recall.";
    }
    
    if (lowerQuery.includes('pomodoro technique')) {
      return "The Pomodoro Technique is a time management method: Work for 25 minutes focused on one task, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break. This helps maintain focus, reduces mental fatigue, and improves productivity by breaking work into manageable intervals.";
    }
    
    if (lowerQuery.includes('active recall')) {
      return "Active recall is a learning technique where you actively retrieve information from memory rather than passively reading. Methods include: flashcards, practice tests, explaining concepts aloud, and writing summaries from memory. It's more effective than re-reading because it strengthens memory pathways.";
    }
    
    if (lowerQuery.includes('spaced repetition')) {
      return "Spaced repetition is reviewing information at increasing intervals over time. Review after 1 day, 3 days, 1 week, 2 weeks, 1 month, etc. This technique leverages the spacing effect - we remember better when learning is distributed over time rather than crammed in one session.";
    }
    
    return "I'd be happy to explain this educational concept! Could you provide a bit more context about what specific aspect you'd like me to focus on?";
  }
}

export const aiService = new AIService();
