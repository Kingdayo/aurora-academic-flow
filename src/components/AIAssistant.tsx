
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Calendar, Target, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

interface AISuggestion {
  id: string;
  type: "task" | "schedule" | "optimization" | "insight";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
}

const AIAssistant = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mockSuggestions: AISuggestion[] = [
    {
      id: "1",
      type: "task",
      title: "Break down complex project",
      description: "Your 'Research Paper' task seems large. Consider breaking it into: Research (3 days), Outline (1 day), Writing (5 days), Review (2 days)",
      priority: "high",
      actionable: true
    },
    {
      id: "2",
      type: "schedule",
      title: "Optimize study schedule",
      description: "Based on your patterns, you're most productive at 10 AM. Schedule difficult tasks then.",
      priority: "medium",
      actionable: true
    },
    {
      id: "3",
      type: "insight",
      title: "Performance insight",
      description: "You complete 85% more tasks when you set specific deadlines. Try adding time blocks to your tasks.",
      priority: "medium",
      actionable: false
    }
  ];

  const handleAIQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setSuggestions(mockSuggestions);
      setIsLoading(false);
      toast.success("AI suggestions generated! 🤖");
    }, 1500);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task": return <Target className="w-4 h-4" />;
      case "schedule": return <Calendar className="w-4 h-4" />;
      case "optimization": return <Zap className="w-4 h-4" />;
      case "insight": return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

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
        <div className="flex space-x-2">
          <Input
            placeholder="Ask AI for task suggestions, scheduling help, or insights..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
          />
          <Button onClick={handleAIQuery} disabled={isLoading}>
            {isLoading ? "Thinking..." : "Ask AI"}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-600">AI Suggestions</h4>
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {getTypeIcon(suggestion.type)}
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{suggestion.title}</h5>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs text-white ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </Badge>
                    {suggestion.actionable && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
