
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  dueTime: string;
  completed: boolean;
  createdAt: string;
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
    subject: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    dueTime: ""
  });

  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title || "",
        description: task.description || "",
        subject: task.subject || "",
        priority: task.priority || "medium",
        dueDate: task.dueDate || "",
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
      <DialogContent className="w-[95vw] max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Task</DialogTitle>
          <DialogDescription className="text-sm">
            Update your task details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm">Task Title</Label>
            <Input
              id="edit-title"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Enter task title"
              className="text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm">Description</Label>
            <Textarea
              id="edit-description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Enter task description"
              className="text-sm"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-subject" className="text-sm">Subject</Label>
              <Input
                id="edit-subject"
                value={editData.subject}
                onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                placeholder="e.g., Math"
                className="text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority" className="text-sm">Priority</Label>
              <Select value={editData.priority} onValueChange={(value: "low" | "medium" | "high") => setEditData({ ...editData, priority: value })}>
                <SelectTrigger className="text-sm">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate" className="text-sm">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={editData.dueDate}
                onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                className="text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueTime" className="text-sm">Due Time</Label>
              <Input
                id="edit-dueTime"
                type="time"
                value={editData.dueTime}
                onChange={(e) => setEditData({ ...editData, dueTime: e.target.value })}
                className="text-sm"
              />
            </div>
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
