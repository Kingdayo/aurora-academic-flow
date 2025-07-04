
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
}

const UserProfile = ({ onAddTask, onTabChange, onVoiceCommands }: UserProfileProps) => {
  const { user, logout } = useAuth();

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
    try {
      await logout();
      toast.success("Logged out successfully! 👋");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Add Task",
      action: onAddTask,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      action: () => onTabChange?.('tasks'),
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: Calendar,
      label: "Calendar",
      action: () => onTabChange?.('calendar'),
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      action: () => onTabChange?.('analytics'),
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: Brain,
      label: "AI Hub",
      action: () => onTabChange?.('ai-hub'),
      color: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: Timer,
      label: "Productivity",
      action: () => onTabChange?.('productivity'),
      color: "text-red-600 dark:text-red-400"
    },
    {
      icon: Mic,
      label: "Voice Commands",
      action: onVoiceCommands,
      color: "text-pink-600 dark:text-pink-400"
    }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center space-x-3 cursor-pointer hover-lift transition-all">
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
      <PopoverContent className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in">
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

            {/* Quick Actions - Mobile Only */}
            <div className="md:hidden">
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
                      className="flex items-center justify-start space-x-2 h-10 px-3 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
