import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceCommand {
  phrase: string;
  action: string;
}

const VoiceCommandButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const commands: VoiceCommand[] = [
    { phrase: "add task", action: "ADD_TASK" },
    { phrase: "show tasks", action: "SHOW_TASKS" },
    { phrase: "start timer", action: "START_TIMER" },
    { phrase: "show calendar", action: "SHOW_CALENDAR" },
    { phrase: "show analytics", action: "SHOW_ANALYTICS" }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        const recognitionInstance = new SpeechRecognitionConstructor();

        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const command = event.results[0][0].transcript.toLowerCase();
          processVoiceCommand(command);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast.error("Voice recognition error. Please try again.");
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const processVoiceCommand = (command: string) => {
    const matchedCommand = commands.find(cmd =>
      command.includes(cmd.phrase)
    );

    if (matchedCommand) {
      toast.success(`Voice command recognized: "${matchedCommand.phrase}"`);

      switch (matchedCommand.action) {
        case "ADD_TASK":
          window.dispatchEvent(new CustomEvent('voice-add-task'));
          break;
        case "SHOW_TASKS":
          window.dispatchEvent(new CustomEvent('voice-tab-change', { detail: { tab: 'tasks' } }));
          break;
        case "START_TIMER":
            window.dispatchEvent(new CustomEvent('voice-start-timer'));
            break;
        case "SHOW_CALENDAR":
            window.dispatchEvent(new CustomEvent('voice-tab-change', { detail: { tab: 'calendar' } }));
            break;
        case "SHOW_ANALYTICS":
            window.dispatchEvent(new CustomEvent('voice-tab-change', { detail: { tab: 'analytics' } }));
            break;
      }
    } else {
      toast.error("Command not recognized.");
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.success("Listening for voice commands...");
    }
  };

  return (
    <Button
      onClick={toggleListening}
      className={`rounded-full h-14 w-14 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-gradient hover:opacity-90'}`}
      size="lg"
    >
      {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
    </Button>
  );
};

export default VoiceCommandButton;
