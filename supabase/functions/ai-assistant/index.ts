import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcademicContext {
  tasks?: any[];
  recentQueries?: string[];
  userProfile?: {
    subjects?: string[];
    academicLevel?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, context }: { 
      query: string; 
      category: string; 
      context?: AcademicContext 
    } = await req.json();

    if (!geminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    // Build academic prompt
    const level = context?.userProfile?.academicLevel || 'university';
    const systemPrompt = `You are a friendly and helpful academic assistant. Your goal is to provide clear, concise, and accurate answers to academic questions. Please provide answers suitable for a ${level} student. Focus on practical, actionable advice.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser question: ${query}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text.trim();

    return new Response(
      JSON.stringify({ 
        response: generatedText,
        model: 'gemini-1.5-flash'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    
    // Fallback responses for different categories
    const fallbacks = {
      study: "Here's a proven study strategy: Use the Pomodoro Technique (25 min focus + 5 min break), create summaries of key concepts, and test yourself regularly. Active recall is more effective than passive reading.",
      tasks: "Break large tasks into smaller, manageable chunks. Set specific deadlines for each part. Use a priority system: urgent & important first, then important but not urgent.",
      subjects: "For better subject understanding: Connect new concepts to what you already know, use multiple learning methods (visual, auditory, kinesthetic), and explain concepts to others.",
      exam: "Effective exam prep: Create a study schedule 2-3 weeks before, practice with past papers, form study groups, and ensure good sleep before the exam.",
      research: "Good research starts with a clear question. Use academic databases, evaluate source credibility, take detailed notes, and organize your findings thematically.",
      time: "Time management tips: Use a calendar app, batch similar tasks together, eliminate distractions during study time, and schedule breaks to maintain focus."
    };

    const { category } = await req.json().catch(() => ({ category: 'study' }));
    const fallbackResponse = fallbacks[category as keyof typeof fallbacks] || fallbacks.study;

    return new Response(
      JSON.stringify({ 
        response: fallbackResponse,
        model: 'fallback',
        error: 'AI service temporarily unavailable'
      }), 
      {
        status: 200, // Return 200 to avoid breaking the UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});