
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Hand, Zap, Eye, MousePointer } from "lucide-react";
import { toast } from "sonner";

interface Gesture {
  name: string;
  action: string;
  description: string;
  detected: boolean;
}

const GestureControls = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [gestures, setGestures] = useState<Gesture[]>([
    { name: "Swipe Right", action: "Next Tab", description: "Swipe right to move to next tab", detected: false },
    { name: "Swipe Left", action: "Previous Tab", description: "Swipe left to move to previous tab", detected: false },
    { name: "Pinch In", action: "Zoom Out", description: "Pinch to zoom out of calendar", detected: false },
    { name: "Pinch Out", action: "Zoom In", description: "Pinch to zoom into calendar details", detected: false },
    { name: "Two Finger Tap", action: "Quick Add", description: "Two finger tap to add new task", detected: false }
  ]);

  const gestureRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isLeftSwipe = distanceX > 50;
      const isRightSwipe = distanceX < -50;
      const isUpSwipe = distanceY > 50;
      const isDownSwipe = distanceY < -50;

      if (isLeftSwipe) {
        handleGesture("Swipe Left");
      } else if (isRightSwipe) {
        handleGesture("Swipe Right");
      } else if (isUpSwipe) {
        handleGesture("Swipe Up");
      } else if (isDownSwipe) {
        handleGesture("Swipe Down");
      }
    };

    const handleGesture = (gestureName: string) => {
      setGestures(prev => 
        prev.map(g => 
          g.name === gestureName 
            ? { ...g, detected: true }
            : { ...g, detected: false }
        )
      );

      // Reset detection after 1 second
      setTimeout(() => {
        setGestures(prev => 
          prev.map(g => ({ ...g, detected: false }))
        );
      }, 1000);

      toast.success(`Gesture detected: ${gestureName} 👋`);
    };

    if (gestureRef.current) {
      gestureRef.current.addEventListener('touchstart', handleTouchStart);
      gestureRef.current.addEventListener('touchmove', handleTouchMove);
      gestureRef.current.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (gestureRef.current) {
        gestureRef.current.removeEventListener('touchstart', handleTouchStart);
        gestureRef.current.removeEventListener('touchmove', handleTouchMove);
        gestureRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isEnabled, touchStart, touchEnd]);

  const calibrateGestures = async () => {
    setIsCalibrating(true);
    toast.success("Gesture calibration started! Follow the prompts 🎯");
    
    // Simulate calibration process
    setTimeout(() => {
      setIsCalibrating(false);
      toast.success("Gesture calibration complete! 🎉");
    }, 3000);
  };

  const toggleGestures = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (enabled) {
      toast.success("Gesture controls enabled! 👋");
    } else {
      toast.success("Gesture controls disabled 🚫");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hand className="w-5 h-5 text-purple-600" />
          <span>Gesture Controls</span>
          {isEnabled && <Badge className="bg-green-500">Active</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="gesture-toggle">Enable Gesture Controls</Label>
          <Switch
            id="gesture-toggle"
            checked={isEnabled}
            onCheckedChange={toggleGestures}
          />
        </div>

        {isEnabled && (
          <>
            <div className="flex space-x-2">
              <Button
                onClick={calibrateGestures}
                disabled={isCalibrating}
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                {isCalibrating ? "Calibrating..." : "Calibrate"}
              </Button>
            </div>

            <div 
              ref={gestureRef}
              className="border-2 border-dashed border-purple-300 rounded-lg p-4 min-h-32 bg-purple-50 flex items-center justify-center"
            >
              <div className="text-center">
                <MousePointer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-700">
                  Gesture detection area - Try swiping here!
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Available Gestures:</h4>
              {gestures.map((gesture, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded transition-colors ${
                    gesture.detected ? 'bg-green-100 border-green-300' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{gesture.name}</span>
                      {gesture.detected && (
                        <Zap className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{gesture.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {gesture.action}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-xs text-gray-500">
          💡 Gesture controls work best on touch devices. Calibrate for optimal performance.
        </div>
      </CardContent>
    </Card>
  );
};

export default GestureControls;
