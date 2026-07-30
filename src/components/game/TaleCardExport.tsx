/**
 * Export a Creators Mark “tale card” — editorial still for sharing.
 */

export interface TaleCardInput {
  characterName: string;
  genre: string;
  mood?: string;
  location?: string;
  paragraph: string;
  accent?: string; // hex
  portraitUrl?: string | null;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  let line = '';
  let lines = 0;
  let cy = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[n] + ' ';
      cy += lineHeight;
      lines++;
      if (lines >= maxLines - 1) {
        const rest = words.slice(n).join(' ');
        let clipped = rest;
        while (ctx.measureText(clipped + '…').width > maxWidth && clipped.length > 0) {
          clipped = clipped.slice(0, -1);
        }
        ctx.fillText(clipped.trim() + '…', x, cy);
        return;
      }
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}

export async function downloadTaleCard(input: TaleCardInput): Promise<void> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  const accent = input.accent || '#d0a05f';

  // Ink ground
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0c0b10');
  grad.addColorStop(0.55, '#14121a');
  grad.addColorStop(1, '#1a1510');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Frame
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.globalAlpha = 1;

  // Brand
  ctx.fillStyle = accent;
  ctx.font = '500 28px Cinzel, Georgia, serif';
  ctx.fillText('UNTOLD', 80, 120);
  ctx.fillStyle = 'rgba(242,226,196,0.55)';
  ctx.font = '400 16px "DM Sans", sans-serif';
  ctx.fillText('CREATORS MARK', 80, 148);

  // Portrait optional
  let textTop = 220;
  if (input.portraitUrl && (input.portraitUrl.startsWith('http') || input.portraitUrl.startsWith('blob') || input.portraitUrl.startsWith('data:'))) {
    try {
      const img = await loadImage(input.portraitUrl);
      const size = 220;
      ctx.save();
      ctx.beginPath();
      ctx.arc(80 + size / 2, 210 + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 80, 210, size, size);
      ctx.restore();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(80 + size / 2, 210 + size / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      textTop = 480;
    } catch {
      textTop = 220;
    }
  }

  ctx.fillStyle = '#f2e2c4';
  ctx.font = '600 52px Cinzel, Georgia, serif';
  ctx.fillText(input.characterName.slice(0, 28), 80, textTop);

  ctx.fillStyle = 'rgba(242,226,196,0.65)';
  ctx.font = '400 22px "DM Sans", sans-serif';
  const meta = [input.genre, input.mood, input.location].filter(Boolean).join(' · ');
  ctx.fillText(meta.slice(0, 60), 80, textTop + 40);

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(80, textTop + 70);
  ctx.lineTo(W - 80, textTop + 70);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(241,245,249,0.92)';
  ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif';
  wrapText(ctx, input.paragraph, 80, textTop + 120, W - 160, 40, 12);

  ctx.fillStyle = 'rgba(208,160,95,0.55)';
  ctx.font = '400 14px "DM Sans", sans-serif';
  ctx.fillText('theuntoldstories.lovable.app', 80, H - 80);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) throw new Error('Export failed');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `untold-tale-${input.characterName.replace(/\s+/g, '-').toLowerCase()}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
