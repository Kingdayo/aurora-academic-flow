
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

  // Mock data for various analytics
  const productivityData = [
    { day: "Mon", completed: 8, planned: 10, efficiency: 80 },
    { day: "Tue", completed: 12, planned: 12, efficiency: 100 },
    { day: "Wed", completed: 6, planned: 8, efficiency: 75 },
    { day: "Thu", completed: 10, planned: 11, efficiency: 91 },
    { day: "Fri", completed: 9, planned: 10, efficiency: 90 },
    { day: "Sat", completed: 5, planned: 6, efficiency: 83 },
    { day: "Sun", completed: 7, planned: 8, efficiency: 88 }
  ];

  const subjectData = [
    { subject: "Mathematics", tasks: 24, completed: 20, color: "#8B5CF6" },
    { subject: "Physics", tasks: 18, completed: 15, color: "#06B6D4" },
    { subject: "Chemistry", tasks: 16, completed: 14, color: "#10B981" },
    { subject: "Biology", tasks: 12, completed: 11, color: "#F59E0B" },
    { subject: "English", tasks: 14, completed: 13, color: "#EF4444" }
  ];

  const timeData = [
    { hour: "6AM", focus: 20 },
    { hour: "8AM", focus: 45 },
    { hour: "10AM", focus: 80 },
    { hour: "12PM", focus: 60 },
    { hour: "2PM", focus: 40 },
    { hour: "4PM", focus: 70 },
    { hour: "6PM", focus: 50 },
    { hour: "8PM", focus: 75 },
    { hour: "10PM", focus: 35 }
  ];

  const insights = [
    {
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      title: "Productivity Trend",
      value: "+12%",
      description: "Your task completion rate improved this week"
    },
    {
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      title: "Peak Hours",
      value: "10 AM - 12 PM",
      description: "Your most productive time of day"
    },
    {
      icon: <Target className="w-4 h-4 text-purple-500" />,
      title: "Success Rate",
      value: "87%",
      description: "Tasks completed on time"
    },
    {
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      title: "Streak",
      value: "5 days",
      description: "Current productivity streak"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Advanced Analytics</h3>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
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
            <SelectTrigger className="w-40">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {insight.icon}
                <span className="text-sm font-medium">{insight.title}</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{insight.value}</div>
              <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Productivity Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Completed", color: "#8B5CF6" },
                planned: { label: "Planned", color: "#E5E7EB" }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
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
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Subject Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectData.map((subject, index) => (
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
                    <Badge variant="outline">
                      {Math.round((subject.completed / subject.tasks) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Focus Time Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Focus Time Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                focus: { label: "Focus Level", color: "#8B5CF6" }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="focus" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span>AI-Powered Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Optimization Tip</h4>
              <p className="text-sm text-blue-700">
                Schedule your most challenging tasks between 10 AM and 12 PM when your focus is at its peak.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Pattern Detected</h4>
              <p className="text-sm text-green-700">
                You complete 25% more tasks on days when you start before 9 AM. Try starting earlier!
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Achievement Unlocked</h4>
              <p className="text-sm text-purple-700">
                You've maintained a 5-day streak! Keep up the momentum to reach your weekly goal.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Suggestion</h4>
              <p className="text-sm text-orange-700">
                Mathematics tasks take 20% longer than estimated. Consider adding buffer time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
