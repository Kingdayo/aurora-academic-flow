import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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

    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const level = context?.userProfile?.academicLevel || 'university';
    const systemPrompt = `You are an academic assistant. Provide a clear, concise, and accurate answer for a ${level} student. Focus on practical, actionable advice.`;

    const apiResponse = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 512,
          temperature: 0.7
        }),
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`Lovable AI error: ${apiResponse.status}`);
    }

    const responseData = await apiResponse.json();
    
    if (!responseData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from Lovable AI');
    }

    const generatedText = responseData.choices[0].message.content.trim();

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