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
      model: 'Xenova/flan-t5-small',
      task: 'text2text-generation',
      maxTokens: 150
    },
    'gpt2': {
      model: 'Xenova/gpt2',
      task: 'text-generation',
      maxTokens: 100
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
        device: 'webgpu',
        dtype: 'fp16'
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
    const basePrompts = {
      study: "You are an academic study advisor. Provide helpful, actionable study advice.",
      tasks: "You are a task management expert for students. Help with academic task organization.",
      subjects: "You are a subject matter expert. Provide clear explanations and learning guidance.",
      exam: "You are an exam preparation specialist. Give practical exam strategies and tips.",
      research: "You are a research methodology expert. Help with research techniques and academic writing.",
      time: "You are a time management coach for students. Provide scheduling and productivity advice."
    };

    let prompt = basePrompts[category as keyof typeof basePrompts] || basePrompts.study;
    
    // Add context if available
    if (context?.tasks && context.tasks.length > 0) {
      const taskCount = context.tasks.length;
      const completedTasks = context.tasks.filter(t => t.completed).length;
      prompt += ` The student currently has ${taskCount} tasks, with ${completedTasks} completed.`;
    }

    if (context?.userProfile?.subjects && context.userProfile.subjects.length > 0) {
      prompt += ` They are studying: ${context.userProfile.subjects.join(', ')}.`;
    }

    // Add conversation context
    if (this.conversationHistory.length > 0) {
      const recentContext = this.conversationHistory.slice(-2).join(' ');
      prompt += ` Previous context: ${recentContext}`;
    }

    prompt += ` Question: ${query}`;
    
    return prompt;
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

  // Fallback responses for when AI fails
  getFallbackResponse(category: string): string {
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
}

export const aiService = new AIService();
