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

    const level = context?.userProfile?.academicLevel || 'university';
    const systemPrompt = `You are an academic assistant. Provide a clear, concise, and accurate answer for a ${level} student. Focus on practical, actionable advice.`;

    const requestBody = {
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
    };

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${apiResponse.status}`);
    }

    const responseData = await apiResponse.json();
    
    if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const generatedText = responseData.candidates[0].content.parts[0].text.trim();

    return new Response(
      JSON.stringify({ response: generatedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in ai-assistant function:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI response.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});