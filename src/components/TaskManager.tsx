
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, Circle, Trash2, Edit, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import TaskEditDialog from "./TaskEditDialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import AllCaughtUp from "./AllCaughtUp";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  createdAt: Date;
}

type ParsedTask = Omit<Task, 'dueDate' | 'createdAt'> & {
  dueDate?: string;
  createdAt: string;
};

interface TaskManagerProps {
  showAddDialog?: boolean;
  onShowAddDialogChange?: (show: boolean) => void;
  activeTab?: string;
}

const TaskManager = ({ showAddDialog = false, onShowAddDialogChange, activeTab }: TaskManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  // const [showAddTaskDialog, setShowAddTaskDialog] = useState(showAddDialog); // Controlled by prop
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { isSupported, isSubscribed, loading, subscribe, scheduleNotification, cancelAllScheduledNotifications } = usePushNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: undefined as Date | undefined,
    dueTime: "",
    priority: "medium" as 'low' | 'medium' | 'high',
    category: "General"
  });

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const loadTasks = () => {
      const savedTasks = localStorage.getItem('aurora-tasks');
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          if (Array.isArray(parsedTasks)) {
            const tasksWithDates = parsedTasks.map((task: ParsedTask) => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              createdAt: new Date(task.createdAt)
            }));
            setTasks(tasksWithDates);
          } else {
            setTasks([]); // Set to empty array if data is not an array
          }
        } catch (error) {
          console.error('Error loading tasks:', error);
          setTasks([]); // Also set to empty array on parsing error
        }
      }
    };

    loadTasks();
  }, []);

  // Effect to sync notifications with tasks
  useEffect(() => {
    const syncNotifications = async () => {
      if (!isSubscribed || !scheduleNotification || !cancelAllScheduledNotifications) return;

      await cancelAllScheduledNotifications();

      const promises: Promise<boolean | void>[] = [];

      for (const task of tasks) {
        if (task.dueDate && !task.completed) {
          const dueDateTime = new Date(task.dueDate);
          if (task.dueTime) {
            const [hours, minutes] = task.dueTime.split(':').map(Number);
            dueDateTime.setHours(hours, minutes, 0, 0);
          } else {
            dueDateTime.setHours(9, 0, 0, 0); // Default to 9 AM on the due day
          }

          const now = new Date();

          // Schedule "due now" notification
          if (dueDateTime > now) {
            promises.push(scheduleNotification(
              task.id,
              `⌛ Task Due: ${task.title}`,
              `Your task "${task.title}" is due now.`,
              dueDateTime
            ));
          }

          // --- Schedule Reminder Notifications ---
          const reminders = [
            { time: 60 * 60 * 1000, id: '1h', msg: 'in 1 hour' },
            { time: 30 * 60 * 1000, id: '30m', msg: 'in 30 minutes' },
            { time: 15 * 60 * 1000, id: '15m', msg: 'in 15 minutes' },
          ];

          for (const reminder of reminders) {
            const reminderTime = new Date(dueDateTime.getTime() - reminder.time);
            if (reminderTime > now) {
              promises.push(scheduleNotification(
                `${task.id}-${reminder.id}`,
                '⏰ Task Reminder',
                `"${task.title}" is due ${reminder.msg}.`,
                reminderTime
              ));
            }
          }
        }
      }

      try {
        await Promise.all(promises);
        console.log('Successfully synced all task notifications.');
      } catch (error) {
        console.error('An error occurred while syncing notifications:', error);
      }
    };

    syncNotifications();
  }, [tasks, isSubscribed, scheduleNotification, cancelAllScheduledNotifications]);

  // Save tasks to localStorage whenever tasks change and trigger countdown update
  const saveTasks = (updatedTasks: Task[]) => {
    try {
      localStorage.setItem('aurora-tasks', JSON.stringify(updatedTasks));
      // Broadcast task changes to other components including countdown
      window.dispatchEvent(new CustomEvent('tasks-updated', { detail: updatedTasks }));
      // Trigger countdown refresh specifically
      window.dispatchEvent(new CustomEvent('tasks-changed'));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  // Update tasks state and save to localStorage
  const updateTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const categories = ["General", "Study", "Assignment", "Project", "Exam", "Personal", "Work"];

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    try {
      const task: Task = {
        id: crypto.randomUUID(),
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        dueTime: newTask.dueTime,
        priority: newTask.priority,
        category: newTask.category,
        completed: false,
        createdAt: new Date()
      };

      const updatedTasks = [task, ...tasks];
      updateTasks(updatedTasks);

      toast.success("Task added successfully! 🎉");
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error("Failed to add task. Please try again.");
    } finally {
      setNewTask({
        title: "",
        description: "",
        dueDate: undefined,
        dueTime: "",
        priority: "medium",
        category: "General"
      });
      if (onShowAddDialogChange) {
        onShowAddDialogChange(false);
      }
    }
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    const updatedTasks = tasks.map(taskItem => 
      taskItem.id === id ? { ...taskItem, completed: !taskItem.completed } : taskItem
    );
    updateTasks(updatedTasks);
    
    if (task) {
      if (task.completed) {
        toast.success("Task restored!");
      } else {
        // Task is being completed
        toast.success("Task completed! 🎉");
        
        // The notification schedule will be updated by the useEffect hook when the task's completed status changes.
      }
    }
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    updateTasks(updatedTasks);
    toast.success("Task deleted");
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    updateTasks(updatedTasks);
    setEditingTask(null);
    setShowEditDialog(false);
    toast.success("Task updated successfully! ✨");
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "completed" && task.completed) ||
                         (filterStatus === "pending" && !task.completed);

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Circle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div
        className="space-y-6"
        style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Task Manager</h2>
            <p className="text-muted-foreground">Organize your academic and personal tasks</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onShowAddDialogChange && onShowAddDialogChange(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <AllCaughtUp />
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id} className={`transition-all hover:shadow-lg ${task.completed ? 'opacity-75' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </h3>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1 capitalize">{task.priority}</span>
                        </Badge>
                        <Badge variant="outline">{task.category}</Badge>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Due: {format(task.dueDate, 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {task.dueTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>at {task.dueTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editTask(task)}
                      className="text-gray-500 hover:text-purple-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={onShowAddDialogChange}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent
            className="w-[95vw] max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50"
            aria-describedby="add-task-description"
          >
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription id="add-task-description">
              Fill in the details below to add a new task to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Enter task description (optional)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Category</Label>
                <Select value={newTask.category} onValueChange={(value) => setNewTask({...newTask, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Due Date (Optional)</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? format(newTask.dueDate, 'PPP') : 'Select due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTask.dueDate}
                    onSelect={(date) => {
                      setNewTask({ ...newTask, dueDate: date });
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Due Time (Optional)</Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={newTask.dueTime}
                  onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                  placeholder="Select time"
                  className="pr-8"
                />
                <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onShowAddDialogChange && onShowAddDialogChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={addTask}
                className="flex-1 bg-purple-gradient hover:opacity-90"
              >
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
        </DialogPortal>
      </Dialog>

      {editingTask && (
        <TaskEditDialog
          task={editingTask}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingTask(null);
          }}
          onSave={handleTaskUpdate}
        />
      )}
      </div>
      {/* Dialogs are here, outside the conditional display wrapper, they rely on DialogPortal */}
    </>
  );
};

export default TaskManager;
