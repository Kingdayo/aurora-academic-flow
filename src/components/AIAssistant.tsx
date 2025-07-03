
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Calendar, Target, TrendingUp, Zap, User, MessageCircle, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";

interface AIResponse {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  category: string;
}

const AIAssistant = () => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getQueryCategory = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('study') || lowerQuery.includes('learn') || lowerQuery.includes('focus') || lowerQuery.includes('concentration')) return 'study';
    if (lowerQuery.includes('task') || lowerQuery.includes('organize') || lowerQuery.includes('priority') || lowerQuery.includes('todo')) return 'tasks';
    if (lowerQuery.includes('time') || lowerQuery.includes('schedule') || lowerQuery.includes('plan') || lowerQuery.includes('calendar')) return 'time';
    if (lowerQuery.includes('motivat') || lowerQuery.includes('productiv') || lowerQuery.includes('lazy') || lowerQuery.includes('procrastinat')) return 'motivation';
    if (lowerQuery.includes('exam') || lowerQuery.includes('test') || lowerQuery.includes('review') || lowerQuery.includes('grade')) return 'exam';
    if (lowerQuery.includes('stress') || lowerQuery.includes('anxiety') || lowerQuery.includes('overwhelm') || lowerQuery.includes('mental')) return 'wellness';
    if (lowerQuery.includes('note') || lowerQuery.includes('reading') || lowerQuery.includes('book')) return 'notes';
    if (lowerQuery.includes('goal') || lowerQuery.includes('target') || lowerQuery.includes('achieve')) return 'goals';
    if (lowerQuery.includes('habit') || lowerQuery.includes('routine') || lowerQuery.includes('daily')) return 'habits';
    if (lowerQuery.includes('subject') || lowerQuery.includes('math') || lowerQuery.includes('science') || lowerQuery.includes('english')) return 'subjects';
    
    return 'general';
  };

  const generateAIResponse = (userQuery: string, category: string): string => {
    // Load user tasks for personalized context
    const savedTasks = localStorage.getItem("tasks");
    const tasks = savedTasks ? JSON.parse(savedTasks) : [];
    const completedTasks = tasks.filter((task: any) => task.completed).length;
    const pendingTasks = tasks.filter((task: any) => !task.completed).length;
    const overdueTasks = tasks.filter((task: any) => {
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && !task.completed;
    }).length;

    // Get subjects and priorities for context
    const subjects = [...new Set(tasks.map((task: any) => task.subject).filter(Boolean))];
    const highPriorityTasks = tasks.filter((task: any) => task.priority === 'high' && !task.completed).length;
    
    // Get current time for time-aware responses
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    switch (category) {
      case 'study':
        const studyTips = [
          `Since it's ${timeOfDay}, try the Pomodoro Technique: 25-minute focused sessions with 5-minute breaks. ${subjects.length > 0 ? `Focus on ${subjects[0]} first if it's challenging.` : ''} Active recall works better than passive reading - test yourself frequently!`,
          
          `Create a distraction-free environment and use the "two-minute rule" - if something takes less than 2 minutes, do it now. ${pendingTasks > 0 ? `You have ${pendingTasks} pending tasks to practice this with.` : ''} Try spaced repetition for better retention.`,
          
          `Break complex topics into smaller chunks. Use visual aids like mind maps for better understanding. ${highPriorityTasks > 0 ? `Start with your ${highPriorityTasks} high-priority tasks.` : ''} The Feynman Technique helps - explain concepts in simple terms.`,
          
          `Study in different locations to improve recall. Use the "elaborative interrogation" method - ask yourself "why" and "how" questions. ${overdueTasks > 0 ? `Address your ${overdueTasks} overdue tasks first to reduce stress.` : 'Great job staying on top of deadlines!'}`
        ];
        return studyTips[Math.floor(Math.random() * studyTips.length)];

      case 'tasks':
        const taskAdvice = [
          `You have ${tasks.length} total tasks (${completedTasks} completed, ${pendingTasks} pending). ${overdueTasks > 0 ? `⚠️ ${overdueTasks} are overdue.` : '✅ Great job staying on track!'} Use the Eisenhower Matrix: urgent+important first, then important but not urgent.`,
          
          `Try task batching - group similar tasks together. ${subjects.length > 1 ? `Organize by subject: ${subjects.join(', ')}.` : ''} Use the "3-2-1" rule: 3 important tasks, 2 medium tasks, 1 quick win daily.`,
          
          `Time-blocking can help: assign specific hours to different tasks. ${pendingTasks > 5 ? 'Consider breaking large tasks into smaller subtasks.' : 'Your task load looks manageable!'} Remember: progress over perfection.`,
          
          `Use the "Getting Things Done" method: capture everything, clarify what it means, organize by context, reflect on your system, and engage with confidence. ${highPriorityTasks > 0 ? `Focus on your ${highPriorityTasks} high-priority items first.` : 'Well prioritized tasks!'}`
        ];
        return taskAdvice[Math.floor(Math.random() * taskAdvice.length)];

      case 'time':
        const timeAdvice = [
          `Time-blocking is powerful: dedicate specific hours to subjects. ${timeOfDay === 'morning' ? 'Morning is great for complex tasks when your mind is fresh.' : timeOfDay === 'afternoon' ? 'Afternoon is perfect for collaborative work and reviews.' : 'Evening is ideal for planning tomorrow and light reviews.'} Plan your week every Sunday.`,
          
          `Use the "time-boxing" technique: set a specific time limit for each task. ${pendingTasks > 0 ? `You have ${pendingTasks} tasks to practice this with.` : ''} Build in buffer time for unexpected interruptions (plan for 25% extra time).`,
          
          `Track your time for a week to identify patterns and time-wasters. ${subjects.length > 0 ? `Allocate time based on subject difficulty and deadlines.` : ''} Use the "Swiss Cheese" method for large projects - poke holes by doing small parts.`,
          
          `Apply Parkinson's Law: work expands to fill available time. Set artificial deadlines. ${overdueTasks > 0 ? 'Consider renegotiating or breaking down overdue tasks.' : 'Your deadline management is excellent!'} Energy management is as important as time management.`
        ];
        return timeAdvice[Math.floor(Math.random() * timeAdvice.length)];

      case 'motivation':
        const motivationBoosts = [
          `Motivation follows action, not the other way around. Start with just 2 minutes on any task. ${completedTasks > 0 ? `You've already completed ${completedTasks} tasks - build on that momentum!` : 'Take the first small step today.'} Celebrate small wins along the way.`,
          
          `Use the "5-minute rule" to overcome procrastination. Often, starting is the hardest part. ${highPriorityTasks > 0 ? 'Start with one high-priority task and see how good it feels to make progress.' : 'You\'re doing great with your priorities!'} Progress compounds over time.`,
          
          `Create a "not-to-do" list alongside your to-do list. Eliminate distractions and time-wasters. ${pendingTasks > 0 ? 'Focus on your current tasks rather than taking on new ones.' : 'Great job maintaining focus!'} Comparison is the thief of joy - focus on your own journey.`,
          
          `Set up reward systems for completing tasks. Make it enjoyable! ${subjects.length > 0 ? `Maybe a treat after finishing work in ${subjects[0]}?` : ''} Remember: discipline is choosing between what you want now and what you want most. You've got this! 💪`
        ];
        return motivationBoosts[Math.floor(Math.random() * motivationBoosts.length)];

      case 'exam':
        const examStrategies = [
          `Create a study schedule 2-3 weeks before exams. Use active recall and spaced repetition rather than cramming. ${subjects.length > 0 ? `For ${subjects.join(' and ')}, focus on past papers and practice problems.` : ''} Sleep 7-9 hours - it's crucial for memory consolidation.`,
          
          `Use the "testing effect" - frequent self-testing improves retention more than re-reading. Create flashcards or practice quizzes. ${pendingTasks > 0 ? 'Clear your pending tasks first to reduce pre-exam stress.' : 'Great job staying organized!'} Form study groups for difficult concepts.`,
          
          `Practice under exam conditions: time limits, no notes, quiet environment. ${overdueTasks > 0 ? 'Address overdue items to avoid last-minute panic.' : 'Your planning is solid!'} Use the "SOAR" method: Survey, Question, Read, Recite, Review.`,
          
          `Day before exam: light review only, no new material. Get everything ready the night before. ${timeOfDay === 'evening' ? 'Perfect time to prepare for tomorrow!' : 'Plan your evening prep time.'} Arrive early, bring backup supplies, and trust your preparation. You've got this! 🎯`
        ];
        return examStrategies[Math.floor(Math.random() * examStrategies.length)];

      case 'wellness':
        const wellnessAdvice = [
          `Academic stress is normal, but manageable. Practice the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8. ${overdueTasks > 0 ? 'Consider breaking overwhelming tasks into smaller, manageable pieces.' : 'Your stress management seems good!'} Regular exercise boosts mood and focus.`,
          
          `Maintain work-life balance: schedule downtime like you would any important appointment. ${completedTasks > 0 ? `You've completed ${completedTasks} tasks - acknowledge your achievements!` : 'Every small step counts.'} Connect with friends and family regularly.`,
          
          `Use the "STOP" technique when overwhelmed: Stop, Take a breath, Observe your thoughts, Proceed mindfully. ${pendingTasks > 3 ? 'Consider which tasks truly need immediate attention.' : 'Your workload looks manageable.'} Mindfulness meditation can reduce anxiety by 58%.`,
          
          `Remember: grades don't define your worth. Progress isn't always linear. ${highPriorityTasks > 0 ? 'Focus on one high-priority task at a time.' : 'Great job balancing your priorities!'} If stress becomes overwhelming, don't hesitate to seek support from counselors or trusted friends. Your mental health matters most! 🧠💚`
        ];
        return wellnessAdvice[Math.floor(Math.random() * wellnessAdvice.length)];

      case 'notes':
        const noteStrategies = [
          `Try the Cornell Note-Taking System: divide pages into cue, note, and summary sections. Review within 24 hours for better retention. ${subjects.length > 0 ? `Especially effective for ${subjects[0]} if it's content-heavy.` : ''} Use abbreviations and symbols to write faster.`,
          
          `Active reading is key: highlight main points, write questions in margins, summarize paragraphs in your own words. ${pendingTasks > 0 ? 'Apply this to your current reading assignments.' : 'Great foundation for effective studying!'} Create concept maps for visual learning.`,
          
          `Use the "SQ3R" method: Survey, Question, Read, Recite, Review. Color-code your notes by topic or importance. ${overdueTasks > 0 ? 'Prioritize note-taking for overdue assignments first.' : 'Your organization skills are on point!'} Digital tools like mind maps can help visual learners.`,
          
          `Teach-back method: explain concepts to someone else or write as if teaching. This reveals gaps in understanding. ${subjects.length > 1 ? `Try connecting concepts across ${subjects.join(' and ')}.` : ''} Review and revise notes regularly - spaced repetition works! 📚`
        ];
        return noteStrategies[Math.floor(Math.random() * noteStrategies.length)];

      case 'goals':
        const goalAdvice = [
          `Use SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound. ${pendingTasks > 0 ? `Your ${pendingTasks} pending tasks are good practice for this framework.` : 'Apply this to future planning!'} Break big goals into weekly and daily milestones.`,
          
          `Write goals down and review them weekly. Visualize success and create a compelling "why" for each goal. ${completedTasks > 0 ? `You've already achieved ${completedTasks} task completions - build on this success!` : 'Start with small, achievable goals.'} Track progress visually with charts or apps.`,
          
          `Use the "1% better" principle: small, consistent improvements compound over time. ${subjects.length > 0 ? `Apply this to ${subjects.join(' and ')} - just 1% improvement daily adds up!` : ''} Focus on systems and processes, not just outcomes.`,
          
          `Create accountability: share goals with others or use apps to track progress. ${highPriorityTasks > 0 ? 'Your high-priority tasks show good goal-setting instincts.' : 'Great job with realistic goal-setting!'} Celebrate milestones and learn from setbacks. Remember: direction matters more than speed! 🎯`
        ];
        return goalAdvice[Math.floor(Math.random() * goalAdvice.length)];

      case 'habits':
        const habitAdvice = [
          `Start with "micro-habits" - actions so small they're impossible to fail. Stack new habits onto existing ones. ${timeOfDay === 'morning' ? 'Morning routines set the tone for the day.' : 'Evening routines help you wind down and prepare for tomorrow.'} Consistency beats intensity.`,
          
          `Use the "2-minute rule": new habits should take less than 2 minutes to do. ${pendingTasks > 0 ? 'Practice this with small parts of your pending tasks.' : 'Apply this to building positive academic habits!'} Environment design is crucial - make good habits obvious and easy.`,
          
          `Track your habits visually - use a calendar or app. Don't break the chain! ${completedTasks > 0 ? `Your task completion rate shows you can build consistent habits.` : 'Every day is a fresh start.'} Focus on identity-based habits: "I am a person who studies daily" rather than "I want to study more."`,
          
          `Allow for flexibility - aim for 85% consistency rather than perfection. ${subjects.length > 0 ? `Create subject-specific study habits for ${subjects.join(', ')}.` : ''} Replace bad habits rather than just eliminating them. It takes 21 days to form a habit, 90 days to create a lifestyle! 🔄`
        ];
        return habitAdvice[Math.floor(Math.random() * habitAdvice.length)];

      case 'subjects':
        const subjectAdvice = [
          `Different subjects require different approaches. Math/Science: practice problems daily, understand concepts before memorizing. ${subjects.includes('Math') || subjects.includes('Science') ? 'Focus on problem-solving strategies and pattern recognition.' : ''} Language Arts: read actively, write regularly, discuss ideas.`,
          
          `For STEM subjects: work backwards from solutions, create formula sheets, teach concepts to others. ${subjects.length > 0 ? `Your subjects (${subjects.join(', ')}) each have unique learning patterns.` : ''} For humanities: focus on connections, debates, and critical thinking.`,
          
          `Use subject-specific memory techniques: mnemonics for history dates, visualization for geography, concept maps for biology. ${pendingTasks > 0 ? 'Apply these techniques to your current assignments.' : 'Perfect time to experiment with new learning methods!'} Practice active recall for all subjects.`,
          
          `Cross-curricular connections strengthen understanding. ${subjects.length > 1 ? `Try connecting concepts between ${subjects.join(' and ')}.` : 'Look for patterns across different subjects.'} Schedule your most challenging subject when you're most alert. Every subject has its own "language" - learn it! 🎓`
        ];
        return subjectAdvice[Math.floor(Math.random() * subjectAdvice.length)];

      default:
        const generalAdvice = [
          `I'm here to help with your academic journey! ${completedTasks > 0 ? `You've completed ${completedTasks} tasks - great momentum!` : 'Ready to tackle some tasks?'} Ask me about study techniques, time management, motivation, or specific subjects. What's on your mind today?`,
          
          `Academic success is about smart work, not just hard work. ${pendingTasks > 0 ? `You have ${pendingTasks} tasks ahead - let's make them manageable!` : 'You\'re well organized!'} I can help with study strategies, goal setting, stress management, and more. What would you like to explore?`,
          
          `Every student's journey is unique. ${subjects.length > 0 ? `I see you're working on ${subjects.join(', ')} - each requires different approaches.` : 'Tell me about your subjects and I can provide specific strategies.'} Whether you need help with productivity, motivation, or learning techniques, I'm here to support you!`,
          
          `Learning is a lifelong adventure! ${overdueTasks === 0 ? 'Great job staying on top of deadlines!' : 'Let\'s work on managing your tasks effectively.'} I can provide personalized advice on study habits, time management, exam preparation, and maintaining balance. What's your biggest challenge right now? 🚀`
        ];
        return generalAdvice[Math.floor(Math.random() * generalAdvice.length)];
    }
  };

  const handleAIQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const category = getQueryCategory(query);
      const response = generateAIResponse(query, category);
      
      const newResponse: AIResponse = {
        id: Date.now().toString(),
        query: query,
        response: response,
        timestamp: new Date().toLocaleTimeString(),
        category: category
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
    "Best time management techniques",
    "How to stay motivated?",
    "Note-taking strategies",
    "Setting academic goals",
    "Building study routines"
  ];

  const getCategoryIcon = (category: string) => {
    const icons = {
      study: BookOpen,
      tasks: CheckCircle2,
      time: Clock,
      motivation: Zap,
      exam: Target,
      wellness: Brain,
      notes: BookOpen,
      goals: Target,
      habits: Calendar,
      subjects: BookOpen,
      general: MessageCircle
    };
    return icons[category as keyof typeof icons] || MessageCircle;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      study: 'text-blue-500',
      tasks: 'text-green-500',
      time: 'text-orange-500',
      motivation: 'text-yellow-500',
      exam: 'text-red-500',
      wellness: 'text-purple-500',
      notes: 'text-indigo-500',
      goals: 'text-pink-500',
      habits: 'text-teal-500',
      subjects: 'text-cyan-500',
      general: 'text-gray-500'
    };
    return colors[category as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>AI Academic Assistant</span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            placeholder="Ask me about study tips, task management, productivity, or anything academic..."
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
            {responses.map((item) => {
              const CategoryIcon = getCategoryIcon(item.category);
              const categoryColor = getCategoryColor(item.category);
              
              return (
                <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-gray-50/50">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-700">{item.query}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{item.timestamp}</span>
                        <Badge variant="outline" className="text-xs">
                          <CategoryIcon className={`w-3 h-3 mr-1 ${categoryColor}`} />
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 leading-relaxed">{item.response}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {responses.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Ask me anything about studying, productivity, or academic success!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
