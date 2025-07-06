
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import LoadingSpinner from "./LoadingSpinner";

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

interface TaskEditDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

const TaskEditDialog = ({ task, isOpen, onClose, onSave }: TaskEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: undefined as Date | undefined,
    dueTime: ""
  });

  const categories = ["General", "Study", "Assignment", "Project", "Exam", "Personal", "Work"];

  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "General",
        priority: task.priority || "medium",
        dueDate: task.dueDate,
        dueTime: task.dueTime || ""
      });
    }
  }, [task]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedTask: Task = {
        ...task,
        ...editData,
      };

      onSave(updatedTask);
      onClose();
      toast.success("Task updated successfully! ✅");
    } catch (error) {
      toast.error("Failed to update task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in"
        aria-describedby="edit-task-description"
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Task</DialogTitle>
          <DialogDescription id="edit-task-description" className="text-sm">
            Update your task details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-task-title" className="text-sm">Task Title</Label>
            <Input
              id="edit-task-title"
              name="title"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Enter task title"
              className="text-sm"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-description" className="text-sm">Description</Label>
            <Textarea
              id="edit-task-description"
              name="description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Enter task description"
              className="text-sm"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-task-category" className="text-sm">Category</Label>
              <Select value={editData.category} onValueChange={(value) => setEditData({ ...editData, category: value })}>
                <SelectTrigger id="edit-task-category" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-priority" className="text-sm">Priority</Label>
              <Select value={editData.priority} onValueChange={(value: "low" | "medium" | "high") => setEditData({ ...editData, priority: value })}>
                <SelectTrigger id="edit-task-priority" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editData.dueDate ? format(editData.dueDate, 'PPP') : 'Select due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={editData.dueDate}
                  onSelect={(date) => setEditData({...editData, dueDate: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-time" className="text-sm">Due Time (Optional)</Label>
            <Input
              id="edit-task-time"
              name="dueTime"
              type="time"
              value={editData.dueTime}
              onChange={(e) => setEditData({ ...editData, dueTime: e.target.value })}
              className="text-sm"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-purple-gradient hover:opacity-90 text-sm" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditDialog;
