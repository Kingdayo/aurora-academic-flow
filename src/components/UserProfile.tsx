import { useState } from "react";
import { useAuth } from "@/App";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Plus, Calendar, BarChart3, Mic, LogOut, CheckSquare, Timer, Brain } from "lucide-react";
import { toast } from "sonner";

interface UserProfileProps {
  onAddTask?: () => void;
  onTabChange?: (tab: string) => void;
  onVoiceCommands?: () => void;
  isLoggingOut?: boolean;
  onLogout?: () => void;
}

const UserProfile = ({ onAddTask, onTabChange, onVoiceCommands, isLoggingOut = false, onLogout }: UserProfileProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      setIsOpen(false);
    }
  };

  const handleQuickAction = (action: (() => void) | undefined) => {
    if (action) {
      action();
      setIsOpen(false);
    }
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Add Task",
      action: () => handleQuickAction(onAddTask),
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      action: () => handleQuickAction(() => onTabChange?.('tasks')),
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: Calendar,
      label: "Calendar",
      action: () => handleQuickAction(() => onTabChange?.('calendar')),
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      action: () => handleQuickAction(() => onTabChange?.('analytics')),
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: Brain,
      label: "AI Hub",
      action: () => handleQuickAction(() => onTabChange?.('ai-hub')),
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: Timer,
      label: "Productivity",
      action: () => handleQuickAction(() => onTabChange?.('productivity')),
      color: "text-red-600 dark:text-red-400"
    },
    {
      icon: Mic,
      label: "Voice Commands",
      action: () => handleQuickAction(onVoiceCommands),
      color: "text-pink-600 dark:text-pink-400"
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center space-x-3 cursor-pointer hover-lift transition-all mobile-friendly-toggle">
          <Avatar className="w-10 h-10 border-2 border-purple-200 dark:border-purple-700 animate-pulse-glow">
            <AvatarFallback className="bg-purple-gradient text-white font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {user?.email}
            </p>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in"
        side="bottom"
        align="end"
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 animate-pulse-glow">
                <AvatarFallback className="bg-purple-gradient text-white font-bold text-xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Student
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">{displayName}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">{user?.email}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    className="flex items-center justify-start space-x-2 h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 mobile-friendly-toggle transition-all duration-200 hover:scale-105"
                  >
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 mobile-friendly-toggle transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
            </Button>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
