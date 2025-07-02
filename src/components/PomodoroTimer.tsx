
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { toast } from "sonner";

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const workTime = 25 * 60; // 25 minutes
  const breakTime = 5 * 60; // 5 minutes

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (mode === "work") {
      setSessions(prev => prev + 1);
      setMode("break");
      setTimeLeft(breakTime);
      toast.success("Great work! Time for a break! ☕");
      
      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("Pomodoro Complete!", {
          body: "Time for a 5-minute break!",
          icon: "/favicon.ico"
        });
      }
    } else {
      setMode("work");
      setTimeLeft(workTime);
      toast.success("Break over! Ready to focus? 🧠");
      
      if (Notification.permission === "granted") {
        new Notification("Break Over!", {
          body: "Time to get back to work!",
          icon: "/favicon.ico"
        });
      }
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode("work");
    setTimeLeft(workTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = mode === "work" ? workTime : breakTime;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {mode === "work" ? (
            <Brain className="w-5 h-5 text-purple-600" />
          ) : (
            <Coffee className="w-5 h-5 text-orange-600" />
          )}
          <span>Pomodoro Timer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {mode === "work" ? "Focus Time" : "Break Time"}
          </div>
          <Progress value={getProgress()} className="mb-4" />
        </div>

        <div className="flex justify-center space-x-2">
          <Button
            onClick={toggleTimer}
            className="bg-purple-gradient hover:opacity-90"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button onClick={resetTimer} variant="outline">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600">
            Sessions completed: <span className="font-semibold">{sessions}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
