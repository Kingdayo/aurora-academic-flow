import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
            const tx = db.transaction('settings', 'readonly');
            const store = tx.objectStore('settings');
            const settings = await store.get('user-preferences');
            if (settings) {
                setSoundEnabled(settings.soundEnabled);
                setVibrationEnabled(settings.vibrationEnabled);
                setSelectedSound(settings.selectedSound);
                setSelectedVibration(settings.selectedVibration);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };
    loadSettings();
}, []);

const handleSaveSettings = async () => {
    const settings = {
      id: 'user-preferences',
      soundEnabled,
      vibrationEnabled,
      selectedSound,
      selectedVibration,
    };

    try {
        const db = await openDB();
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        await store.put(settings);
        await tx.done;

        toast({
            title: 'Settings Saved',
            description: 'Your notification preferences have been updated.',
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
        toast({
            title: 'Error',
            description: 'Could not save your settings.',
            variant: 'destructive',
        });
    }
};

const openDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('aurora-db', 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('scheduled_notifications')) {
                db.createObjectStore('scheduled_notifications', { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notification Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sounds & Vibration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-switch">Enable Notification Sound</Label>
            <Switch
              id="sound-switch"
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
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="chime">Chime</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="ding">Ding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="vibration-switch">Enable Vibration</Label>
            <Switch
              id="vibration-switch"
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
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <button onClick={handleSaveSettings} className="w-full bg-primary text-primary-foreground py-2 rounded-md">
            Save Settings
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;