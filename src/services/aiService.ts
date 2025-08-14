import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface AIServiceConfig {
  model: string;
  task: 'text-generation' | 'text2text-generation';
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
  private pipelines: Map<string, any> = new Map();
  private loadingStates: Map<string, boolean> = new Map();
  private conversationHistory: string[] = [];

  private configs: Record<string, AIServiceConfig> = {
    'flan-t5': {
      model: 'Xenova/flan-t5-base',
      task: 'text2text-generation',
      maxTokens: 200
    },
    'distilgpt2': {
      model: 'Xenova/distilgpt2',
      task: 'text-generation',
      maxTokens: 150
    }
  };

  async initializeModel(modelKey: string = 'flan-t5'): Promise<void> {
    if (this.pipelines.has(modelKey)) return;
    
    if (this.loadingStates.get(modelKey)) return;
    
    this.loadingStates.set(modelKey, true);
    
    try {
      const config = this.configs[modelKey];
      console.log(`Loading AI model: ${config.model}`);
      
      const pipe = await pipeline(config.task, config.model, {
        device: 'wasm',
        dtype: 'fp32'
      });
      
      this.pipelines.set(modelKey, pipe);
      console.log(`Model ${modelKey} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load model ${modelKey}:`, error);
      throw error;
    } finally {
      this.loadingStates.set(modelKey, false);
    }
  }

  isModelLoading(modelKey: string = 'flan-t5'): boolean {
    return this.loadingStates.get(modelKey) || false;
  }

  private buildAcademicPrompt(query: string, category: string, context?: AcademicContext): string {
    // Enhanced prompts for better educational responses
    const basePrompts = {
      study: "Explain the following educational concept clearly and provide practical learning tips:",
      tasks: "Help organize this academic task or provide study management advice for:",
      subjects: "Provide a clear, educational explanation of:",
      exam: "Give exam preparation strategies and tips for:",
      research: "Explain research methods and academic writing guidance for:",
      time: "Provide time management and study scheduling advice for:"
    };

    let prompt = basePrompts[category as keyof typeof basePrompts] || basePrompts.subjects;
    
    // For educational concepts, use a more direct approach
    if (this.isEducationalConcept(query)) {
      prompt = "Provide a clear, comprehensive explanation of:";
    }
    
    // Add academic context
    if (context?.userProfile?.academicLevel) {
      prompt += ` (for ${context.userProfile.academicLevel} level)`;
    }

    prompt += ` ${query}`;
    
    return prompt;
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
    modelKey: string = 'flan-t5'
  ): Promise<string> {
    try {
      // Ensure model is loaded
      if (!this.pipelines.has(modelKey)) {
        await this.initializeModel(modelKey);
      }

      const pipeline = this.pipelines.get(modelKey);
      if (!pipeline) {
        throw new Error(`Model ${modelKey} not available`);
      }

      const prompt = this.buildAcademicPrompt(query, category, context);
      const config = this.configs[modelKey];

      console.log('Generating AI response with prompt:', prompt);

      const result = await pipeline(prompt, {
        max_new_tokens: config.maxTokens,
        temperature: 0.7,
        do_sample: true,
        pad_token_id: 50256
      });

      let response: string;
      
      if (config.task === 'text-generation') {
        response = result[0].generated_text.replace(prompt, '').trim();
      } else {
        response = result[0].generated_text.trim();
      }

      // Clean up response
      response = this.cleanResponse(response);
      
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
      throw error;
    }
  }

  private cleanResponse(response: string): string {
    // Remove common artifacts
    response = response
      .replace(/^(Answer:|Response:|A:)/i, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure it's not too short or just repeated text
    if (response.length < 10 || response.includes('...')) {
      return "I'd be happy to help you with that! Could you provide a bit more detail about what specific aspect you'd like me to focus on?";
    }

    return response;
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
