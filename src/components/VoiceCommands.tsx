
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceCommand {
  phrase: string;
  action: string;
  description: string;
}

const VoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const commands: VoiceCommand[] = [
    { phrase: "add task", action: "ADD_TASK", description: "Opens the add task dialog" },
    { phrase: "show tasks", action: "SHOW_TASKS", description: "Switches to tasks view" },
    { phrase: "start timer", action: "START_TIMER", description: "Starts the Pomodoro timer" },
    { phrase: "show calendar", action: "SHOW_CALENDAR", description: "Switches to calendar view" },
    { phrase: "show analytics", action: "SHOW_ANALYTICS", description: "Switches to analytics view" }
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setTranscript(command);
        processVoiceCommand(command);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("Voice recognition error. Please try again.");
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const processVoiceCommand = (command: string) => {
    const matchedCommand = commands.find(cmd => 
      command.includes(cmd.phrase)
    );

    if (matchedCommand) {
      toast.success(`Voice command recognized: "${matchedCommand.phrase}"`);
      
      // Here you would typically dispatch actions or call functions
      switch (matchedCommand.action) {
        case "ADD_TASK":
          // Trigger add task dialog
          break;
        case "SHOW_TASKS":
          // Switch to tasks tab
          break;
        case "START_TIMER":
          // Start Pomodoro timer
          break;
        case "SHOW_CALENDAR":
          // Switch to calendar tab
          break;
        case "SHOW_ANALYTICS":
          // Switch to analytics tab
          break;
      }
    } else {
      toast.error("Command not recognized. Try one of the supported commands.");
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-purple-600" />
          <span>Voice Commands</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleListening}
            className={`${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-gradient hover:opacity-90'}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
          
          <Button
            onClick={() => speakText("Voice commands are ready. Say 'add task' to create a new task.")}
            variant="outline"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Test Voice
          </Button>
        </div>

        {isListening && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">🎤 Listening for commands...</p>
          </div>
        )}

        {transcript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm"><strong>Last command:</strong> "{transcript}"</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Supported Commands:</h4>
          {commands.map((command, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <Badge variant="secondary" className="mr-2">
                  "{command.phrase}"
                </Badge>
                <span className="text-xs text-gray-600">{command.description}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCommands;
