
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface UserTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserTour = ({ isOpen, onClose }: UserTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      target: "header",
      title: "Welcome to Aurora! 🌟",
      content: "This is your AI-powered academic planner. Let's take a quick tour to get you started!",
      position: 'bottom'
    },
    {
      target: "tabs",
      title: "Navigation Tabs",
      content: "Switch between different sections: Tasks, Calendar, Analytics, AI Hub, Productivity tools, and Settings.",
      position: 'bottom'
    },
    {
      target: "fab-buttons",
      title: "Quick Actions",
      content: "Use these floating buttons for quick access to add tasks, voice commands, calendar, and analytics.",
      position: 'left'
    },
    {
      target: "task-section",
      title: "Task Management",
      content: "Create, organize, and track your tasks here. You can add due dates, priorities, and categories.",
      position: 'top'
    },
    {
      target: "voice-button",
      title: "Voice Commands",
      content: "Click here or say 'add task', 'show calendar', 'start timer' to control Aurora with your voice!",
      position: 'left'
    }
  ];

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem('aurora-tour-completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0 pointer-events-none">
        {/* Spotlight effect for current step */}
        <div className="absolute inset-0 bg-black/70" />
      </div>
      
      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60">
        <Card className="w-96 max-w-[90vw] bg-white dark:bg-gray-800 shadow-2xl animate-scale-in">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {currentStep + 1}
                </div>
                <span className="text-sm text-gray-500">
                  {currentStep + 1} of {tourSteps.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {currentTourStep.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {currentTourStep.content}
            </p>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextStep}
                className="bg-purple-gradient hover:opacity-90 flex items-center space-x-2"
              >
                <span>{currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</span>
                {currentStep < tourSteps.length - 1 && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={completeTour}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip tour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserTour;
