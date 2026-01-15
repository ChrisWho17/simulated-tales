// Achievement export/share functionality
// Allows players to share their achievements as images or links

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Image, Link, Copy, Check, Download, X, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Achievement, ACHIEVEMENT_CATEGORIES } from './Achievements';
import { format } from 'date-fns';

interface AchievementExportProps {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  className?: string;
}

const rarityColors = {
  common: 'bg-slate-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
};

const rarityBorders = {
  common: 'border-slate-400',
  uncommon: 'border-green-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-amber-400',
};

export function AchievementExport({ achievements, unlockedCount, totalCount, className }: AchievementExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  // Generate shareable text
  const generateShareText = useCallback(() => {
    const rarityStats = {
      common: unlockedAchievements.filter(a => a.rarity === 'common').length,
      uncommon: unlockedAchievements.filter(a => a.rarity === 'uncommon').length,
      rare: unlockedAchievements.filter(a => a.rarity === 'rare').length,
      epic: unlockedAchievements.filter(a => a.rarity === 'epic').length,
      legendary: unlockedAchievements.filter(a => a.rarity === 'legendary').length,
    };

    const topAchievements = [...unlockedAchievements]
      .sort((a, b) => {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      })
      .slice(0, 5);

    let text = `🏆 Untold Story Engine - Trophy Showcase\n\n`;
    text += `📊 ${unlockedCount}/${totalCount} Achievements (${completionPercent}%)\n\n`;
    
    if (rarityStats.legendary > 0) text += `⭐ Legendary: ${rarityStats.legendary}\n`;
    if (rarityStats.epic > 0) text += `💜 Epic: ${rarityStats.epic}\n`;
    if (rarityStats.rare > 0) text += `💙 Rare: ${rarityStats.rare}\n`;
    if (rarityStats.uncommon > 0) text += `💚 Uncommon: ${rarityStats.uncommon}\n`;
    if (rarityStats.common > 0) text += `⬜ Common: ${rarityStats.common}\n`;
    
    if (topAchievements.length > 0) {
      text += `\n🎖️ Top Achievements:\n`;
      topAchievements.forEach(a => {
        text += `${a.icon} ${a.name}\n`;
      });
    }

    text += `\n#UntoldStories #Gaming #Achievements`;
    return text;
  }, [unlockedAchievements, unlockedCount, totalCount, completionPercent]);

  // Copy share text to clipboard
  const handleCopyText = useCallback(async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, [generateShareText]);

  // Generate share link
  const handleCopyLink = useCallback(async () => {
    // Create a simple encoded share data
    const shareData = {
      u: unlockedCount,
      t: totalCount,
      r: {
        c: unlockedAchievements.filter(a => a.rarity === 'common').length,
        u: unlockedAchievements.filter(a => a.rarity === 'uncommon').length,
        r: unlockedAchievements.filter(a => a.rarity === 'rare').length,
        e: unlockedAchievements.filter(a => a.rarity === 'epic').length,
        l: unlockedAchievements.filter(a => a.rarity === 'legendary').length,
      },
      top: unlockedAchievements
        .sort((a, b) => {
          const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        })
        .slice(0, 3)
        .map(a => a.id)
    };
    
    const encoded = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}/achievements?share=${encoded}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  }, [unlockedCount, totalCount, unlockedAchievements]);

  // Download as image (using canvas)
  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current) return;
    
    setGenerating(true);
    
    try {
      // Dynamic import html2canvas-like functionality using canvas
      const card = cardRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Canvas not supported');
        return;
      }

      // Set canvas size
      canvas.width = 600;
      canvas.height = 400;

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 600, 400);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 400);

      // Add decorative elements
      ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
      ctx.beginPath();
      ctx.arc(500, 80, 150, 0, Math.PI * 2);
      ctx.fill();

      // Title
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 Trophy Showcase', 300, 60);

      // Stats
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px system-ui';
      ctx.fillText(`${unlockedCount}/${totalCount} Achievements`, 300, 110);
      
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '16px system-ui';
      ctx.fillText(`${completionPercent}% Complete`, 300, 140);

      // Rarity breakdown
      const rarities = [
        { name: 'Legendary', color: '#fbbf24', count: unlockedAchievements.filter(a => a.rarity === 'legendary').length },
        { name: 'Epic', color: '#a855f7', count: unlockedAchievements.filter(a => a.rarity === 'epic').length },
        { name: 'Rare', color: '#3b82f6', count: unlockedAchievements.filter(a => a.rarity === 'rare').length },
        { name: 'Uncommon', color: '#22c55e', count: unlockedAchievements.filter(a => a.rarity === 'uncommon').length },
        { name: 'Common', color: '#64748b', count: unlockedAchievements.filter(a => a.rarity === 'common').length },
      ];

      let yPos = 180;
      ctx.font = '14px system-ui';
      ctx.textAlign = 'left';
      
      rarities.forEach(r => {
        if (r.count > 0) {
          ctx.fillStyle = r.color;
          ctx.fillRect(180, yPos - 10, 12, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${r.name}: ${r.count}`, 200, yPos);
          yPos += 25;
        }
      });

      // Top achievements
      const topAchievements = unlockedAchievements
        .sort((a, b) => {
          const order = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
          return order[a.rarity] - order[b.rarity];
        })
        .slice(0, 3);

      if (topAchievements.length > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Featured Achievements', 300, yPos + 20);

        ctx.font = '14px system-ui';
        ctx.fillStyle = '#ffffff';
        topAchievements.forEach((a, i) => {
          ctx.fillText(`${a.icon} ${a.name}`, 300, yPos + 45 + i * 22);
        });
      }

      // Footer
      ctx.fillStyle = '#666666';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Untold Story Engine', 300, 380);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `untold-achievements-${format(new Date(), 'yyyy-MM-dd')}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Image downloaded!');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate image:', err);
      toast.error('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  }, [unlockedCount, totalCount, completionPercent, unlockedAchievements]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Share Your Achievements
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="text" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-2">
              <Copy className="w-4 h-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link className="w-4 h-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <Image className="w-4 h-4" />
              Image
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
              {generateShareText()}
            </div>
            <Button onClick={handleCopyText} className="w-full gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="text-center py-6">
              <Link className="w-12 h-12 mx-auto text-primary mb-4" />
              <p className="text-muted-foreground mb-4">
                Generate a shareable link to your trophy showcase
              </p>
              <Button onClick={handleCopyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Share Link'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4 mt-4">
            {/* Preview card (hidden, used for reference) */}
            <div ref={cardRef} className="hidden" />
            
            {/* Visual preview */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 border border-border/50">
              <div className="absolute top-2 right-2">
                <Sparkles className="w-5 h-5 text-amber-400/50 animate-pulse" />
              </div>
              
              <div className="text-center">
                <Trophy className="w-10 h-10 mx-auto text-amber-400 mb-2" />
                <h3 className="text-lg font-bold text-white">Trophy Showcase</h3>
                <p className="text-2xl font-bold text-amber-400">{unlockedCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">{completionPercent}% Complete</p>
              </div>
              
              <div className="flex justify-center gap-4 mt-4">
                {[
                  { rarity: 'legendary', color: 'bg-amber-500', count: unlockedAchievements.filter(a => a.rarity === 'legendary').length },
                  { rarity: 'epic', color: 'bg-purple-500', count: unlockedAchievements.filter(a => a.rarity === 'epic').length },
                  { rarity: 'rare', color: 'bg-blue-500', count: unlockedAchievements.filter(a => a.rarity === 'rare').length },
                ].filter(r => r.count > 0).map(r => (
                  <div key={r.rarity} className="flex items-center gap-1">
                    <div className={cn("w-3 h-3 rounded-full", r.color)} />
                    <span className="text-xs text-white">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleDownloadImage} 
              className="w-full gap-2"
              disabled={generating}
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Download Image'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default AchievementExport;
