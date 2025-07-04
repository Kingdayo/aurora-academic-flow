
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen } from "lucide-react";

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

const CalendarSection = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const tasksForDay = getTasksForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          className={`h-20 p-2 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover-lift ${
            isToday ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300' : ''
          } ${isSelected ? 'bg-purple-200 dark:bg-purple-800/50' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm font-medium ${isToday ? 'text-purple-600 dark:text-purple-400' : ''}`}>
              {day}
            </span>
            <div className="flex-1 overflow-hidden">
              {tasksForDay.slice(0, 2).map((task, index) => (
                <div
                  key={task.id}
                  className="text-xs bg-purple-500 text-white rounded px-1 py-0.5 mb-1 truncate animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {task.title}
                </div>
              ))}
              {tasksForDay.length > 2 && (
                <div className="text-xs text-gray-500">+{tasksForDay.length - 2} more</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const upcomingTasks = tasks
    .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) >= new Date())
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 hover-lift transition-all animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Academic Calendar</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  ←
                </button>
                <h3 className="text-lg font-semibold min-w-[200px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span>Upcoming Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover-lift transition-all animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        task.priority === 'high' ? 'bg-red-500 text-white' :
                        task.priority === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                    <BookOpen className="w-3 h-3" />
                    <span>{task.category}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                    {task.dueTime && ` at ${task.dueTime}`}
                  </div>
                </div>
              ))}
              {upcomingTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Details for Selected Date */}
      {selectedDate && (
        <Card className="hover-lift transition-all animate-fade-in-up">
          <CardHeader>
            <CardTitle>
              Tasks for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTasksForDate(selectedDate).map((task, index) => (
                <div 
                  key={task.id} 
                  className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover-lift transition-all animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h4 className="font-semibold mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {task.category}
                    </Badge>
                    <Badge 
                      className={`text-white ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  {task.dueTime && (
                    <div className="text-xs text-gray-500 mt-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Due at {task.dueTime}
                    </div>
                  )}
                </div>
              ))}
              {getTasksForDate(selectedDate).length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks scheduled for this date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarSection;
