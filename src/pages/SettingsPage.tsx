import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const DB_NAME = 'aurora-db';
const DB_VERSION = 1;
const SETTINGS_STORE_NAME = 'settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

interface UserPreferences {
  id: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  selectedSound: string;
  selectedVibration: string;
}

const SettingsPage = () => {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState('default');
  const [selectedVibration, setSelectedVibration] = useState('default');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(SETTINGS_STORE_NAME, 'readonly');
        const store = tx.objectStore(SETTINGS_STORE_NAME);
        const request = store.get('user-preferences');
        
        request.onsuccess = () => {
          const settings = request.result as UserPreferences;
          if (settings) {
            setSoundEnabled(settings.soundEnabled);
            setVibrationEnabled(settings.vibrationEnabled);
            setSelectedSound(settings.selectedSound);
            setSelectedVibration(settings.selectedVibration);
          }
        };
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    const settings: UserPreferences = {
      id: 'user-preferences',
      soundEnabled,
      vibrationEnabled,
      selectedSound,
      selectedVibration,
    };

    try {
      const db = await openDB();
      const tx = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE_NAME);
      store.put(settings);
      
      tx.oncomplete = () => {
        toast({
          title: 'Settings Saved',
          description: 'Your notification preferences have been updated.',
        });
      };
      
      tx.onerror = () => {
        throw new Error('Transaction failed');
      };
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Could not save your settings.',
        variant: 'destructive',
      });
    }
  };

  // Auto-save when settings change
  useEffect(() => {
    handleSaveSettings();
  }, [soundEnabled, vibrationEnabled, selectedSound, selectedVibration]);

  const sounds = [
    { value: 'default', label: 'Default' },
    { value: 'chime', label: 'Chime' },
    { value: 'bell', label: 'Bell' },
    { value: 'alert', label: 'Alert' },
  ];

  const vibrations = [
    { value: 'default', label: 'Default' },
    { value: 'short', label: 'Short' },
    { value: 'long', label: 'Long' },
    { value: 'pulse', label: 'Pulse' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sound Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled">Enable Sound</Label>
            <Switch
              id="sound-enabled"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          {soundEnabled && (
            <div className="space-y-2">
              <Label htmlFor="sound-select">Notification Sound</Label>
              <Select value={selectedSound} onValueChange={setSelectedSound}>
                <SelectTrigger id="sound-select">
                  <SelectValue placeholder="Select a sound" />
                </SelectTrigger>
                <SelectContent>
                  {sounds.map((sound) => (
                    <SelectItem key={sound.value} value={sound.value}>
                      {sound.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vibration Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="vibration-enabled">Enable Vibration</Label>
            <Switch
              id="vibration-enabled"
              checked={vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
            />
          </div>

          {vibrationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="vibration-select">Vibration Pattern</Label>
              <Select value={selectedVibration} onValueChange={setSelectedVibration}>
                <SelectTrigger id="vibration-select">
                  <SelectValue placeholder="Select a pattern" />
                </SelectTrigger>
                <SelectContent>
                  {vibrations.map((vibration) => (
                    <SelectItem key={vibration.value} value={vibration.value}>
                      {vibration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
