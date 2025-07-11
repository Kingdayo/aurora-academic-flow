
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { List, Plus, CheckCircle, Circle, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import OfflineSync from "@/components/OfflineSync";
import useTaskNotifications from "@/hooks/useTaskNotifications";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  completed: boolean;
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const storedTasks = localStorage.getItem('tasks');
      return storedTasks ? JSON.parse(storedTasks) : [];
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
      return [];
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { notificationPermission, requestPermission, showNotification, hasBeenNotified, markAsNotified } = useTaskNotifications();

  useEffect(() => {
    if (notificationPermission === 'default') {
      requestPermission();
    }
  }, [notificationPermission, requestPermission]);

  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
    }
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      completed: false,
      dueDate: selectedDate,
      dueTime: selectedTime,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setIsAddingTask(false);
    toast({
      title: "Success",
      description: "Task added successfully!",
    });
  };

  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast({
      title: "Success",
      description: "Task deleted successfully!",
    });
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditedTaskTitle(task.title);
  };

  const saveEditedTask = () => {
    setTasks(
      tasks.map((task) =>
        task.id === editingTask ? { ...task, title: editedTaskTitle } : task
      )
    );
    setEditingTask(null);
    setEditedTaskTitle("");
    toast({
      title: "Success",
      description: "Task updated successfully!",
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditedTaskTitle("");
  };

  // Task due time checking with reduced frequency
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    let intervalId: NodeJS.Timeout;
    
    const checkTasks = () => {
      try {
        const storedTasks = localStorage.getItem('tasks');
        if (!storedTasks) return;

        const tasks = JSON.parse(storedTasks);
        const currentTime = new Date();

        tasks.forEach((task: any) => {
          if (task.completed || hasBeenNotified(task.id)) return;

          if (task.dueDate && task.dueTime) {
            const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
            const timeDiff = dueDateTime.getTime() - currentTime.getTime();
            
            // Only notify if within 1 minute window
            if (timeDiff <= 60000 && timeDiff >= -60000) {
              showNotification(`Task Due: ${task.title}`, {
                body: task.description || `Your task "${task.title}" is now due.`,
                tag: `task-${task.id}`,
              });
              markAsNotified(task.id);
            }
          }
        });
      } catch (error) {
        console.error('[Dashboard] Error checking tasks:', error);
      }
    };

    // Check every 30 seconds instead of every second
    intervalId = setInterval(checkTasks, 30000);
    
    // Initial check
    checkTasks();

    return () => {
      clearInterval(intervalId);
    };
  }, [notificationPermission, showNotification, hasBeenNotified, markAsNotified]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border dark:bg-gray-900">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Aurora</h1>
              <ThemeToggle />
            </div>

            <div className="mb-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>{user?.email?.[0].toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{user?.email || "No Email"}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.email ? "Logged In" : "Not Logged In"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" className="mt-4 w-full" onClick={logout}>
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>

            <OfflineSync />

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium tracking-tight">Navigation</h4>
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/dashboard")}>
                <List className="mr-2 h-4 w-4" />
                Tasks
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
            <Badge variant="secondary">
              {tasks.filter((task) => !task.completed).length} pending
            </Badge>
          </div>

          {/* Add Task Section */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add Task</CardTitle>
              <CardDescription>Add a new task to your list.</CardDescription>
            </CardHeader>
            <CardContent>
              {!isAddingTask ? (
                <Button onClick={() => setIsAddingTask(true)}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      placeholder="Enter task title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          {selectedDate ? format(selectedDate, "PPP") : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center" side="bottom">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) =>
                            date > new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i)
                          .map((hour) => {
                            const time = String(hour).padStart(2, '0') + ":00";
                            return <SelectItem key={time} value={time}>{time}</SelectItem>;
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                    <Button onClick={addTask}>Add</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task List Section */}
          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>Your current tasks.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="rounded-md border">
                <div className="divide-y divide-border">
                  {tasks.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No tasks yet. Add some!</div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={() => toggleComplete(task.id)}
                          />
                          <Label htmlFor={`task-${task.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                            {editingTask === task.id ? (
                              <Input
                                value={editedTaskTitle}
                                onChange={(e) => setEditedTaskTitle(e.target.value)}
                                onBlur={saveEditedTask}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEditedTask();
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                autoFocus
                                className="text-sm"
                              />
                            ) : (
                              <div className="flex items-center">
                                {task.completed ? (
                                  <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="mr-1 h-4 w-4 text-gray-400" />
                                )}
                                <span>{task.title}</span>
                              </div>
                            )}
                          </Label>
                          {task.dueDate && (
                            <Badge variant="outline">
                              {format(task.dueDate, "MMM dd, yyyy")} {task.dueTime}
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {editingTask !== task.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={saveEditedTask}>
                                Save
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
