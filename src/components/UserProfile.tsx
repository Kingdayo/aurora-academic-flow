
import { useAuth } from "@/App";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Mail } from "lucide-react";

const UserProfile = () => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

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
            
            <div className="space-y-3">
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
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
