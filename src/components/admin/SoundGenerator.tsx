import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Play, Volume2 } from 'lucide-react';

export function SoundGenerator() {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [filename, setFilename] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      addLog('Error: Please enter a prompt');
      return;
    }
    addLog(`Generating sound: "${prompt.slice(0, 50)}..."`);
    // Generation logic will go here
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Sound Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., weather_rain"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                placeholder="e.g., rain_light_01"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the sound you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate}>
              <Play className="h-4 w-4 mr-2" />
              Generate Sound
            </Button>
          </div>

          {log.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Log</h4>
              <ScrollArea className="h-48 border rounded-md p-3 bg-muted/50">
                {log.map((entry, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground">
                    {entry}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
