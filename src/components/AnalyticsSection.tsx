
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Target, Clock, BookOpen, CheckCircle, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  dueTime?: string;
  completed: boolean;
  createdAt: Date;
}

const AnalyticsSection = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadTasks = () => {
      const savedTasks = localStorage.getItem("aurora-tasks");
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          const tasksWithDates = parsedTasks.map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            createdAt: new Date(task.createdAt)
          }));
          setTasks(tasksWithDates);
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
      }
    };

    loadTasks();

    // Listen for task updates
    const handleTasksUpdate = (event: CustomEvent) => {
      const updatedTasks = event.detail.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt)
      }));
      setTasks(updatedTasks);
    };

    window.addEventListener('tasks-updated', handleTasksUpdate as EventListener);

    return () => {
      window.removeEventListener('tasks-updated', handleTasksUpdate as EventListener);
    };
  }, []);

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Category-wise task distribution
  const categoryData = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    category,
    count,
    completed: tasks.filter(t => t.category === category && t.completed).length
  }));

  // Priority distribution
  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#EF4444' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#F59E0B' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#10B981' }
  ].filter(item => item.value > 0);

  // Weekly progress
  const getWeeklyData = () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      weeks.push({
        week: `Week ${7 - i}`,
        created: weekTasks.length,
        completed: weekTasks.filter(t => t.completed).length
      });
    }
    
    return weeks;
  };

  const weeklyData = getWeeklyData();

  // Overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return !task.completed && dueDate < today;
  });

  const upcomingTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return !task.completed && dueDate >= today && dueDate <= nextWeek;
  });

  // AI-powered insights based on real-time data
  const getAIInsights = () => {
    const insights = [];
    
    if (completionRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Progress!',
        message: `You're maintaining a ${completionRate.toFixed(1)}% completion rate. Keep up the great work!`,
        icon: '🎉'
      });
    } else if (completionRate < 40) {
      insights.push({
        type: 'warning',
        title: 'Focus Needed',
        message: `Your completion rate is ${completionRate.toFixed(1)}%. Consider breaking tasks into smaller chunks.`,
        icon: '⚠️'
      });
    }

    if (overdueTasks.length > 0) {
      insights.push({
        type: 'urgent',
        title: 'Overdue Alert',
        message: `You have ${overdueTasks.length} overdue task(s). Prioritize these to get back on track.`,
        icon: '🚨'
      });
    }

    if (upcomingTasks.length > 5) {
      insights.push({
        type: 'info',
        title: 'Busy Week Ahead',
        message: `${upcomingTasks.length} tasks due soon. Plan your time effectively.`,
        icon: '📅'
      });
    }

    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    if (highPriorityTasks > 3) {
      insights.push({
        type: 'warning',
        title: 'High Priority Focus',
        message: `${highPriorityTasks} high-priority tasks pending. Consider tackling these first.`,
        icon: '🎯'
      });
    }

    return insights;
  };

  const aiInsights = getAIInsights();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Insights Card */}
      {aiInsights.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 hover-lift transition-all animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
              <span>AI-Powered Insights</span>
              <Badge variant="secondary" className="ml-auto">Real-time</Badge>
            </CardTitle>
            <CardDescription>Smart recommendations based on your current progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                    insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                    insight.type === 'urgent' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  } animate-scale-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <Card className="hover-lift transition-all animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              All time tasks created
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks remaining
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="hover-lift transition-all animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Overall Progress</span>
          </CardTitle>
          <CardDescription>Your academic task completion progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span>{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
              <div className="text-sm text-yellow-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{overdueTasks.length}</div>
              <div className="text-sm text-red-600">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Distribution */}
        <Card className="hover-lift transition-all animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Tasks by Category</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribution of tasks across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Total" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No tasks data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Priority Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Tasks categorized by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    fontSize={12}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No priority data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card className="lg:col-span-2 hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Weekly Progress</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Task creation and completion over the past 7 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={2} name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks Alert */}
      {upcomingTasks.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 hover-lift transition-all animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-600 text-sm sm:text-base">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Upcoming Deadlines</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Tasks due within the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTasks.slice(0, 5).map((task, index) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{task.category}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </Badge>
                    {task.dueTime && (
                      <div className="text-xs text-gray-500 mt-1">at {task.dueTime}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsSection;
