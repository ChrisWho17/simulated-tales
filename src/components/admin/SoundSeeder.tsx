import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Volume2 } from 'lucide-react';

export function SoundSeeder() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Seeder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sound seeder ready for new definitions. Add your sound categories and prompts here.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={() => addLog('Ready to seed sounds...')}>
              <Play className="h-4 w-4 mr-2" />
              Start Seeding
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
