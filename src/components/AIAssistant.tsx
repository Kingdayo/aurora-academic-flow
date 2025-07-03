
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Calendar, Target, TrendingUp, Zap, User, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";

interface AIResponse {
  id: string;
  query: string;
  response: string;
  timestamp: string;
}

const AIAssistant = () => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateAIResponse = (userQuery: string): string => {
    const lowerQuery = userQuery.toLowerCase();
    
    // Load user tasks for context
    const savedTasks = localStorage.getItem("tasks");
    const tasks = savedTasks ? JSON.parse(savedTasks) : [];
    const completedTasks = tasks.filter((task: any) => task.completed).length;
    const pendingTasks = tasks.filter((task: any) => !task.completed).length;
    const overdueTasks = tasks.filter((task: any) => {
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && !task.completed;
    }).length;
    
    // Study and productivity advice
    if (lowerQuery.includes('study') || lowerQuery.includes('focus') || lowerQuery.includes('concentration')) {
      return `Here are some effective study techniques: 1) Use the Pomodoro Technique (25 min focus + 5 min break) 2) Create a distraction-free environment 3) Break large topics into smaller chunks 4) Use active recall by testing yourself 5) Take regular breaks to maintain focus. You currently have ${pendingTasks} pending tasks - consider prioritizing them by difficulty and deadline.`;
    }
    
    // Task management advice
    if (lowerQuery.includes('task') || lowerQuery.includes('organize') || lowerQuery.includes('priority')) {
      if (tasks.length === 0) {
        return "Start by adding your first task! Break down your academic goals into smaller, manageable tasks. Set specific deadlines and priorities to stay organized. Use the SMART criteria: Specific, Measurable, Achievable, Relevant, and Time-bound.";
      }
      return `You have ${tasks.length} total tasks (${completedTasks} completed, ${pendingTasks} pending). ${overdueTasks > 0 ? `⚠️ ${overdueTasks} tasks are overdue - consider updating deadlines or priorities.` : ''} Tip: Focus on high-priority tasks first and break complex tasks into smaller steps.`;
    }
    
    // Time management
    if (lowerQuery.includes('time') || lowerQuery.includes('schedule') || lowerQuery.includes('plan')) {
      return "Effective time management tips: 1) Use time-blocking to dedicate specific hours to different subjects 2) Identify your peak productivity hours 3) Plan your week in advance 4) Leave buffer time for unexpected tasks 5) Use our Pomodoro timer for focused work sessions. Remember: consistency is more important than perfection!";
    }
    
    // Motivation and productivity
    if (lowerQuery.includes('motivat') || lowerQuery.includes('productiv') || lowerQuery.includes('lazy') || lowerQuery.includes('procrastinat')) {
      return "Beat procrastination with these strategies: 1) Start with the '2-minute rule' - if it takes less than 2 minutes, do it now 2) Use the 'just 5 minutes' technique to overcome initial resistance 3) Reward yourself after completing tasks 4) Break overwhelming tasks into tiny steps 5) Find an accountability partner. Remember: progress over perfection!";
    }
    
    // Exam preparation
    if (lowerQuery.includes('exam') || lowerQuery.includes('test') || lowerQuery.includes('review')) {
      return "Exam preparation strategy: 1) Create a study schedule 2-3 weeks before exams 2) Use active recall and spaced repetition 3) Form study groups for difficult topics 4) Practice past papers and sample questions 5) Take care of your health - proper sleep, nutrition, and exercise improve memory and focus.";
    }
    
    // Stress and wellbeing
    if (lowerQuery.includes('stress') || lowerQuery.includes('anxiety') || lowerQuery.includes('overwhelm') || lowerQuery.includes('mental health')) {
      return "Managing academic stress: 1) Practice deep breathing and mindfulness 2) Break large projects into smaller tasks 3) Maintain a healthy work-life balance 4) Get adequate sleep (7-9 hours) 5) Stay connected with friends and family 6) Consider speaking with a counselor if stress becomes overwhelming. Remember: your mental health is just as important as your academic success.";
    }
    
    // Note-taking
    if (lowerQuery.includes('note') || lowerQuery.includes('reading')) {
      return "Effective note-taking methods: 1) Cornell Note-Taking System - divide pages into cue, note, and summary sections 2) Mind mapping for visual learners 3) The Outline Method for structured information 4) Active reading - highlight key points and write questions in margins 5) Review and revise notes within 24 hours for better retention.";
    }
    
    // Default helpful response
    const helpfulResponses = [
      `Based on your current progress (${completedTasks} completed tasks), you're doing great! Keep building momentum by tackling one task at a time.`,
      "I'm here to help with study techniques, time management, task organization, and academic productivity. What specific area would you like to improve?",
      "Consider using the Pomodoro Technique for better focus, or try breaking down your larger tasks into smaller, manageable steps.",
      "Remember: consistent small steps lead to big achievements. Focus on progress, not perfection!"
    ];
    
    return helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
  };

  const handleAIQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = generateAIResponse(query);
      
      const newResponse: AIResponse = {
        id: Date.now().toString(),
        query: query,
        response: response,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setResponses(prev => [newResponse, ...prev]);
      setQuery("");
      toast.success("AI response generated! 🤖");
    } catch (error) {
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How can I improve my study habits?",
    "Help me organize my tasks better",
    "Tips for managing exam stress",
    "Best time management techniques"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>AI Assistant</span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            placeholder="Ask me about study tips, task management, or productivity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
            className="flex-1 text-sm"
          />
          <Button 
            onClick={handleAIQuery} 
            disabled={isLoading || !query.trim()}
            className="bg-purple-gradient hover:opacity-90 whitespace-nowrap"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Ask AI"}
          </Button>
        </div>

        {/* Quick Prompts */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-600">Quick prompts:</h4>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setQuery(prompt)}
                className="text-xs hover:bg-purple-50"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>

        {/* Responses */}
        {responses.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h4 className="font-semibold text-sm text-gray-600">Recent conversations:</h4>
            {responses.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-gray-50/50">
                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700">{item.query}</p>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{item.response}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {responses.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Ask me anything about studying, productivity, or task management!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
