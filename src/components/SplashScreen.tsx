import LoadingSpinner from "@/components/LoadingSpinner";
import { Book } from "lucide-react";

const SplashScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center relative">
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 z-10" />
      <div className="relative z-20 flex flex-col items-center space-y-6 p-8">
        <div className="w-20 h-20 bg-purple-gradient rounded-full flex items-center justify-center animate-pulse-glow">
          <Book className="w-10 h-10 text-white" />
        </div>
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loading Aurora...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your academic journey awaits.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
