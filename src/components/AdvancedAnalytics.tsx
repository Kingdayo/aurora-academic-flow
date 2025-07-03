
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Target, Zap, Calendar, BookOpen } from "lucide-react";

const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [selectedMetric, setSelectedMetric] = useState("productivity");
  const [tasks, setTasks] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>({
    productivity: [],
    subjects: [],
    timeData: [],
    insights: []
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem("tasks");
    const userTasks = savedTasks ? JSON.parse(savedTasks) : [];
    setTasks(userTasks);
    
    // Generate analytics based on real user data
    generateAnalytics(userTasks);
  };

  const generateAnalytics = (userTasks: any[]) => {
    // Generate productivity data based on user's tasks
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const productivityData = last7Days.map(date => {
      const dayTasks = userTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toDateString() === date.toDateString();
      });
      
      const completed = dayTasks.filter(task => task.completed).length;
      const planned = dayTasks.length;
      const efficiency = planned > 0 ? Math.round((completed / planned) * 100) : 0;
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        planned,
        efficiency
      };
    });

    // Generate subject performance data
    const subjectStats = userTasks.reduce((acc, task) => {
      const subject = task.subject || 'Other';
      if (!acc[subject]) {
        acc[subject] = { total: 0, completed: 0 };
      }
      acc[subject].total++;
      if (task.completed) {
        acc[subject].completed++;
      }
      return acc;
    }, {});

    const subjectData = Object.entries(subjectStats).map(([subject, stats]: [string, any], index) => ({
      subject,
      tasks: stats.total,
      completed: stats.completed,
      color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][index % 5]
    }));

    // Generate time analysis (mock data for now since we don't track actual usage times)
    const timeData = [
      { hour: "8AM", focus: userTasks.length > 0 ? 45 : 0 },
      { hour: "10AM", focus: userTasks.length > 0 ? 80 : 0 },
      { hour: "12PM", focus: userTasks.length > 0 ? 60 : 0 },
      { hour: "2PM", focus: userTasks.length > 0 ? 40 : 0 },
      { hour: "4PM", focus: userTasks.length > 0 ? 70 : 0 },
      { hour: "6PM", focus: userTasks.length > 0 ? 50 : 0 },
      { hour: "8PM", focus: userTasks.length > 0 ? 75 : 0 }
    ];

    // Generate insights based on real data
    const completedTasks = userTasks.filter(task => task.completed).length;
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const highPriorityTasks = userTasks.filter(task => task.priority === 'high').length;
    const overdueTasks = userTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && !task.completed;
    }).length;

    const insights = [
      {
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        title: "Completion Rate",
        value: `${completionRate}%`,
        description: `${completedTasks} out of ${totalTasks} tasks completed`
      },
      {
        icon: <Target className="w-4 h-4 text-blue-500" />,
        title: "High Priority Tasks",
        value: highPriorityTasks.toString(),
        description: "Tasks marked as high priority"
      },
      {
        icon: <Clock className="w-4 h-4 text-orange-500" />,
        title: "Overdue Tasks",
        value: overdueTasks.toString(),
        description: "Tasks past their due date"
      },
      {
        icon: <Zap className="w-4 h-4 text-purple-500" />,
        title: "Active Subjects",
        value: Object.keys(subjectStats).length.toString(),
        description: "Different subjects you're working on"
      }
    ];

    setAnalyticsData({
      productivity: productivityData,
      subjects: subjectData,
      timeData,
      insights
    });
  };

  const generateAIInsights = () => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) {
      return [
        {
          type: "getting-started",
          title: "Get Started",
          content: "Start by adding your first task to begin tracking your academic progress!"
        }
      ];
    }

    const insights = [];
    
    if (completedTasks > 0) {
      insights.push({
        type: "achievement",
        title: "Great Progress!",
        content: `You've completed ${completedTasks} tasks. Keep up the momentum!`
      });
    }

    const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed).length;
    if (highPriorityTasks > 0) {
      insights.push({
        type: "priority",
        title: "Focus on High Priority",
        content: `You have ${highPriorityTasks} high priority tasks pending. Consider tackling these first.`
      });
    }

    const overdueTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && !task.completed;
    }).length;

    if (overdueTasks > 0) {
      insights.push({
        type: "urgent",
        title: "Overdue Tasks",
        content: `You have ${overdueTasks} overdue tasks. Consider updating your schedule or priorities.`
      });
    }

    return insights;
  };

  const aiInsights = generateAIInsights();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl sm:text-2xl font-bold">Advanced Analytics</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-full sm:w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="subjects">Subjects</SelectItem>
              <SelectItem value="time">Time Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {analyticsData.insights.map((insight: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                {insight.icon}
                <span className="text-xs sm:text-sm font-medium">{insight.title}</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{insight.value}</div>
              <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Productivity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Productivity Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Completed", color: "#8B5CF6" },
                planned: { label: "Planned", color: "#E5E7EB" }
              }}
              className="h-48 sm:h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.productivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="completed" stroke="#8B5CF6" strokeWidth={2} />
                  <Line type="monotone" dataKey="planned" stroke="#E5E7EB" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Subject Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.subjects.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.subjects.map((subject: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-medium">{subject.subject}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {subject.completed}/{subject.tasks}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((subject.completed / subject.tasks) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No subjects data available</p>
                <p className="text-xs text-gray-400 mt-1">Add tasks with subjects to see performance breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span>AI-Powered Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg ${
                insight.type === 'achievement' ? 'bg-green-50' :
                insight.type === 'priority' ? 'bg-blue-50' :
                insight.type === 'urgent' ? 'bg-red-50' :
                'bg-purple-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  insight.type === 'achievement' ? 'text-green-800' :
                  insight.type === 'priority' ? 'text-blue-800' :
                  insight.type === 'urgent' ? 'text-red-800' :
                  'text-purple-800'
                }`}>{insight.title}</h4>
                <p className={`text-sm ${
                  insight.type === 'achievement' ? 'text-green-700' :
                  insight.type === 'priority' ? 'text-blue-700' :
                  insight.type === 'urgent' ? 'text-red-700' :
                  'text-purple-700'
                }`}>{insight.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
