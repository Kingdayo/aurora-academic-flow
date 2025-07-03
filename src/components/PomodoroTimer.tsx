import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Settings {
  workDuration: number;
  breakDuration: number;
  soundEnabled: boolean;
}

const PomodoroTimer = () => {
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState(25 * 60);
  const [sessions, setSessions] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    workDuration: 25,
    breakDuration: 5,
    soundEnabled: true
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    setCurrentTime(settings.workDuration * 60);
  }, [settings.workDuration, settings.breakDuration]);

  // Add event listener for voice commands
  useEffect(() => {
    const handleStartTimer = () => {
      if (!isActive) {
        setIsActive(true);
        toast.success("Pomodoro timer started via voice command! 🎤");
      }
    };

    window.addEventListener('start-pomodoro-timer', handleStartTimer);
    
    return () => {
      window.removeEventListener('start-pomodoro-timer', handleStartTimer);
    };
  }, [isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime <= 0) {
            clearInterval(interval);
            
            if (settings.soundEnabled) {
              const audio = new Audio('/sounds/notification.mp3');
              audio.play();
            }

            setTotalTime(prevTotal => prevTotal + (isBreak ? settings.breakDuration * 60 : settings.workDuration * 60));

            if (!isBreak) {
              setSessions(prevSessions => prevSessions + 1);
              toast.success("Work session complete! Time for a break! 🎉");
            } else {
              toast.success("Break over! Time to get back to work! 💪");
            }

            setIsActive(false);
            setIsBreak(!isBreak);
            return !isBreak ? settings.breakDuration * 60 : settings.workDuration * 60;
          } else {
            return prevTime - 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, isBreak, settings]);

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setCurrentTime(settings.workDuration * 60);
    toast.info("Timer reset!");
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Timer className="w-5 h-5 text-purple-600" />
          <span>Pomodoro Timer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(156, 163, 175, 0.3)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={isActive ? "url(#gradient)" : "rgba(156, 163, 175, 0.5)"}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (currentTime / (settings.workDuration * 60)))}`}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                {(currentTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {isBreak ? 'Break Time' : 'Focus Time'}
              </div>
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => setIsActive(!isActive)}
            className={`px-6 py-2 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-gradient hover:opacity-90'}`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button
            onClick={resetTimer}
            variant="outline"
            className="px-6 py-2"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{sessions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Sessions</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{Math.floor(totalTime / 60)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Minutes</div>
          </div>
        </div>

        {/* Timer Settings */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Timer Settings</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work-duration" className="text-sm">Work Duration (minutes)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.workDuration}
                  onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
                  className="flex-1"
                  disabled={isActive}
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="break-duration" className="text-sm">Break Duration (minutes)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="break-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.breakDuration}
                  onChange={(e) => updateSettings({ breakDuration: parseInt(e.target.value) || 5 })}
                  className="flex-1"
                  disabled={isActive}
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <Label htmlFor="sound-enabled" className="text-sm">Sound Notifications</Label>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
