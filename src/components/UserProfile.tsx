import { useState } from "react";
import { useAuth } from "@/App";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const UserProfile = () => {
  const { user, logout, loggingOut } = useAuth();
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
    await logout();
    setIsOpen(false);
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverContent
        className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in"
        side="bottom"
        align="end"
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Theme</h4>
              <ThemeToggle />
            </div>
            
            <Separator className="my-4" />
            
            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 mobile-friendly-toggle transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? "Signing out..." : "Logout"}</span>
            </Button>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
