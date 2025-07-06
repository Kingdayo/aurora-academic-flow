
import { Button } from "@/components/ui/button";
import { useTheme } from "@/App";
import { Moon, Sun } from "lucide-react";
import { useCallback, useRef } from "react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isTogglingRef = useRef(false);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    // Prevent any event bubbling that could interfere with mobile nav
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent rapid consecutive clicks
    if (isTogglingRef.current) return;
    
    isTogglingRef.current = true;
    
    try {
      // Use RAF to ensure the toggle happens after current event cycle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toggleTheme();
          // Reset the flag after a delay
          setTimeout(() => {
            isTogglingRef.current = false;
          }, 500);
        });
      });
    } catch (error) {
      console.error('Theme toggle error:', error);
      isTogglingRef.current = false;
    }
  }, [toggleTheme]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="bg-white/80 dark:bg-gray-800/80 border-purple-200/50 dark:border-purple-700/50 hover-glow transition-all animate-scale-in theme-toggle-isolated"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      name="theme-toggle"
      id="theme-toggle"
      data-theme-toggle="true"
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        isolation: 'isolate',
        contain: 'layout style paint',
        zIndex: 100,
        position: 'relative'
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
