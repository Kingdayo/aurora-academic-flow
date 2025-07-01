
import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-600 to-purple-400 flex items-center justify-center">
      <div className="text-center space-y-8 animate-fade-in-up">
        {/* Main Logo/Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center animate-pulse-glow">
            <div className="w-16 h-16 bg-gradient-to-br from-white to-purple-200 rounded-full flex items-center justify-center animate-spin-slow">
              <div className="w-8 h-8 bg-purple-600 rounded-full animate-bounce-gentle"></div>
            </div>
          </div>
          {/* Floating particles */}
          <div className="absolute -top-4 -right-4 w-3 h-3 bg-white/60 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute -bottom-4 -left-4 w-2 h-2 bg-white/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 -left-8 w-4 h-4 bg-white/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white animate-slide-in-right">
            EduPlanner
          </h1>
          <p className="text-purple-100 text-lg animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            Academic Task Reminder System
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto space-y-2 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white to-purple-200 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-purple-100 text-sm">{progress}% Complete</p>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 animate-scale-in" style={{ animationDelay: '0.6s' }}>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
