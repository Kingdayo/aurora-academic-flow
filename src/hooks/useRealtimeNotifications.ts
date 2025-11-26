import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  user_id: string;
}

export const useRealtimeNotifications = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('tasks-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          handleTaskChange(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    const handleTaskChange = (payload: any) => {
      const { eventType, new: newTask, old: oldTask } = payload;

      if (eventType === 'INSERT') {
        const task = newTask as Task;
        toast({
          title: 'New Task Created',
          description: `"${task.title}" has been added to your tasks`,
        });
      } else if (eventType === 'UPDATE') {
        const task = newTask as Task;
        const oldTaskData = oldTask as Task;

        if (!oldTaskData.completed && task.completed) {
          toast({
            title: 'Task Completed',
            description: `"${task.title}" has been marked as completed! 🎉`,
          });
        }
        else if (oldTaskData.due_date !== task.due_date || oldTaskData.due_time !== task.due_time) {
          toast({
            title: 'Task Updated',
            description: `Due date for "${task.title}" has been updated`,
          });
        }
      }
    };

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { isConnected };
};
