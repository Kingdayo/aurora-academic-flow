
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
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-600 to-purple-400 flex items-center justify-center overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-16 h-16 bg-white/10 rounded-lg animate-float-3d" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-32 w-12 h-12 bg-white/15 rounded-full animate-float-3d" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-20 h-20 bg-white/8 rounded-lg rotate-45 animate-float-3d" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-14 h-14 bg-white/12 rounded-full animate-float-3d" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-white/20 rounded-lg animate-float-3d" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 right-10 w-10 h-10 bg-white/18 rounded-full animate-float-3d" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="text-center space-y-8 animate-fade-in-up relative z-10">
        {/* 3D Loading Cube */}
        <div className="relative perspective-1000">
          <div className="w-32 h-32 mx-auto relative animate-cube-3d">
            {/* Cube faces */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-purple-200/30 rounded-lg transform-gpu backface-hidden"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-white/30 rounded-lg transform-gpu backface-hidden rotate-y-90 origin-right"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-purple-300/20 rounded-lg transform-gpu backface-hidden rotate-y-180"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300/20 to-white/20 rounded-lg transform-gpu backface-hidden rotate-y-270 origin-left"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-purple-100/25 rounded-lg transform-gpu backface-hidden rotate-x-90 origin-top"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/25 to-white/25 rounded-lg transform-gpu backface-hidden rotate-x-270 origin-bottom"></div>
            
            {/* Center glow */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/40 rounded-full blur-md transform -translate-x-1/2 -translate-y-1/2 animate-pulse-3d"></div>
          </div>
          
          {/* Orbiting particles */}
          <div className="absolute top-1/2 left-1/2 w-48 h-48 transform -translate-x-1/2 -translate-y-1/2">
            <div className="absolute top-0 left-1/2 w-3 h-3 bg-white/60 rounded-full animate-orbit" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-white/80 rounded-full animate-orbit-reverse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-0 left-1/2 w-4 h-4 bg-white/40 rounded-full animate-orbit-slow" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>

        {/* App Name with 3D effect */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white animate-slide-in-right text-shadow-3d">
            Aurora
          </h1>
          <p className="text-purple-100 text-xl animate-slide-in-right tracking-wide" style={{ animationDelay: '0.2s' }}>
            Academic Task Planner
          </p>
        </div>

        {/* 3D Progress Ring */}
        <div className="w-80 mx-auto space-y-4 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="relative w-24 h-24 mx-auto">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
                className="drop-shadow-lg"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out drop-shadow-lg"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" />
                  <stop offset="100%" stopColor="#e0e7ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white drop-shadow-lg">{progress}%</span>
            </div>
          </div>
          <p className="text-purple-100 text-sm">Initializing your workspace...</p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-3 animate-scale-in" style={{ animationDelay: '0.6s' }}>
          <div className="w-4 h-4 bg-white/60 rounded-full animate-bounce-3d" style={{ animationDelay: '0s' }}></div>
          <div className="w-4 h-4 bg-white/60 rounded-full animate-bounce-3d" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-4 h-4 bg-white/60 rounded-full animate-bounce-3d" style={{ animationDelay: '0.6s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
