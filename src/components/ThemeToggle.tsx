
import { Button } from "@/components/ui/button";
import { useTheme } from "@/App";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    // Ensure smooth theme transition without blocking UI
    requestAnimationFrame(() => {
      try {
        toggleTheme();
      } catch (error) {
        console.error('Theme toggle error:', error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 hover-glow transition-all animate-scale-in"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      name="theme-toggle"
      id="theme-toggle"
      data-theme-toggle="true"
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        isolation: 'isolate'
      }}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-purple-600 animate-bounce-gentle" />
      ) : (
        <Sun className="h-4 w-4 text-purple-400 animate-bounce-gentle" />
      )}
    </Button>
  );
};

export default ThemeToggle;
