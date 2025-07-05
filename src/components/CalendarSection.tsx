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

    const handleTasksChanged = () => {
      loadTasks();
    };

    window.addEventListener('tasks-updated', handleTasksUpdate as EventListener);
    window.addEventListener('tasks-changed', handleTasksChanged);

    return () => {
      window.removeEventListener('tasks-updated', handleTasksUpdate as EventListener);
      window.removeEventListener('tasks-changed', handleTasksChanged);
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
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-16 md:h-20"></div>);
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
          className={`h-12 sm:h-16 md:h-20 p-1 sm:p-2 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover-lift ${
            isToday ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300' : ''
          } ${isSelected ? 'bg-purple-200 dark:bg-purple-800/50' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex flex-col h-full">
            <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-purple-600 dark:text-purple-400' : ''}`}>
              {day}
            </span>
            <div className="flex-1 overflow-hidden">
              {tasksForDay.slice(0, window.innerWidth < 640 ? 1 : 2).map((task, index) => (
                <div
                  key={task.id}
                  className="text-xs bg-purple-500 text-white rounded px-1 py-0.5 mb-1 truncate animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {task.title.length > 8 ? `${task.title.substring(0, 8)}...` : task.title}
                </div>
              ))}
              {tasksForDay.length > (window.innerWidth < 640 ? 1 : 2) && (
                <div className="text-xs text-gray-500">+{tasksForDay.length - (window.innerWidth < 640 ? 1 : 2)}</div>
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
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      
      // Include time in sorting if available
      if (a.dueTime && b.dueTime) {
        const [hoursA, minutesA] = a.dueTime.split(':').map(Number);
        const [hoursB, minutesB] = b.dueTime.split(':').map(Number);
        dateA.setHours(hoursA, minutesA);
        dateB.setHours(hoursB, minutesB);
      }
      
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 hover-lift transition-all animate-fade-in-up overflow-hidden">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-sm sm:text-base flex-shrink-0"
                  aria-label="Previous month"
                >
                  ←
                </button>
                <h3 className="text-sm sm:text-lg font-semibold text-center min-w-[120px] sm:min-w-[180px]">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-sm sm:text-base flex-shrink-0"
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="w-full overflow-hidden">
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-4">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1 sm:py-2">
                    {window.innerWidth < 640 ? day.substring(0, 1) : day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {renderCalendar()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="hover-lift transition-all animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Upcoming Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {upcomingTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover-lift transition-all animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-1 sm:mb-2">
                    <h4 className="font-semibold text-xs sm:text-sm truncate mr-2">{task.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs flex-shrink-0 ${
                        task.priority === 'high' ? 'bg-red-500 text-white' :
                        task.priority === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{task.category}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                    {task.dueTime && ` at ${task.dueTime}`}
                  </div>
                </div>
              ))}
              {upcomingTasks.length === 0 && (
                <div className="text-center py-4 sm:py-8 text-gray-500">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming tasks</p>
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
            <CardTitle className="text-sm sm:text-base">
              Tasks for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {getTasksForDate(selectedDate).map((task, index) => (
                <div 
                  key={task.id} 
                  className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover-lift transition-all animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {task.category}
                    </Badge>
                    <Badge 
                      className={`text-white text-xs ${
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
                <div className="col-span-full text-center py-4 sm:py-8 text-gray-500">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks scheduled for this date</p>
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
